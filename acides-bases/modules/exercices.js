/* ============================================================
   Exercices du module 5 (application « Chapitre 16 : Acides et bases ») :
   les exercices de la feuille, dans l'ordre et avec leur numérotation
   (7, 8, 10, 11, 13, 9 p. 201-202 ; 17, 20 p. 203), puis le sujet de bac
   (exercice 4, le maraîcher : lettre A) et l'extrait de bac (carottes de
   glace : lettre B).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: fonction qui les fabrique } ; chaque partie suit le format
   de AB.PARTIES avec p.q (question) et p.correction (correction
   détaillée : formule, grandeur isolée, application numérique avec les
   unités). Outils : AB.partieConjugue (+ H⁺ / − H⁺), AB.partieGamma
   (règle du gamma), AB.methode (schéma de la méthode, assets/schema-methode.js),
   AB.figSurvie (échelle de survie de l'exercice 9, refaite en SVG).

   Valeurs vérifiées par un script :
     ex. 9 : 10⁻⁵·⁰ = 1,0 × 10⁻⁵ ; 10⁻⁴·⁴ = 3,98 × 10⁻⁵ ≈ 4,0 × 10⁻⁵ ; 10⁻⁵·⁹ = 1,26 × 10⁻⁶ ≈ 1,3 × 10⁻⁶ mol/L ;
       −log(1,0 × 10⁻⁵) = 5,0 ; −log(1,2 × 10⁻⁶) = 5,92 ≈ 5,9 ; −log(3,2 × 10⁻⁶) = 5,49 ≈ 5,5 ;
       −log(0,9 × 10⁻⁴) = 4,05 ≈ 4,0 ;
     ex. 17 : n = 1,0 / 97,1 = 1,03 × 10⁻² ≈ 1,0 × 10⁻² mol ;
     ex. 20 : 10⁻⁸·⁵ = 3,16 × 10⁻⁹ ≈ 3,2 × 10⁻⁹ ; 10⁻⁶·⁵ = 3,16 × 10⁻⁷ ≈ 3,2 × 10⁻⁷ mol/L ;
       nᵢ = 3,2 × 10⁻⁹ × 200 = 6,4 × 10⁻⁷ mol ; n_f = 3,2 × 10⁻⁷ × 200 = 6,4 × 10⁻⁵ mol ;
       n = 6,4 × 10⁻⁵ − 6,4 × 10⁻⁷ = 6,34 × 10⁻⁵ ≈ 6,3 × 10⁻⁵ mol ; V = 6,3 × 10⁻⁵ / 1,0 × 10⁻² = 6,3 × 10⁻³ L = 6,3 mL ;
     A : 450 × 600 = 270 000 g = 270 kg ; 10⁻⁵·⁶ = 2,51 × 10⁻⁶ ≈ 2,5 × 10⁻⁶ mol/L ;
       n = 2,5 × 10⁻⁶ × 60 000 = 0,15 mol ; M(CaCO₃) = 40 + 12 + 3 × 16 = 100 g/mol ; m = 1,3 × 100 = 130 g ;
     B : 10⁻⁶·² = 6,31 × 10⁻⁷ ≈ 6,3 × 10⁻⁷ mol/L.
   Écarts avec les corrections :
     ex. 9 : la barre des anguilles est tracée jusqu'à pH 4,4, la valeur de la correction
       (sur le graphique du manuel, elle semble s'arrêter vers 4,6) ;
     A, question 1 : la correction écrit « de 6,1 à 6,5 » (lapsus) ; c'est de 6,1 à 6,6, soit 0,5 unité.
   Remarque pour le professeur (ex. 20 f) : le raisonnement du corrigé est gardé ; il néglige les ions
     HO⁻ de l'eau à pH 8,5 ([HO⁻] = 10⁻⁵·⁵ ≈ 3,2 × 10⁻⁶ mol/L, soit ≈ 6,3 × 10⁻⁴ mol dans 200 L)
     qu'il faudrait neutraliser d'abord : environ 64 mL d'acide en plus.
   ============================================================ */
(function () {
  'use strict';

  const { o, fmt, sci, fr, H, H3O, EAU, HO, CH, UNITE, CP, f, couple, demi, partieConjugue, partieGamma, gammaFig,
    Hde, pHde, diagH, diagPH, diagV, diagMasse, methode, EQS, eqTexte, figSurvie } = window.AB;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const donnees = l => `<p class="ph-donnees">Données : ${l.join(' ; ')}.</p>`;
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options, bonne, correction, colonne: options.some(x => x.label.replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false, rel: .02 }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .03 }, opts);
  // partie « demi-équation d'un couple » : H⁺ du mauvais côté, acide et base inversés
  const choixDemi = (lettre, cp) => choix(`${lettre}) Quelle est la demi-équation du couple ${f(cp.a)} / ${f(cp.b)} ?`,
    [o('ok', demi(cp)), o('cote', `${f(cp.a)} + ${H} = ${f(cp.b)}`), o('inv', `${f(cp.b)} = ${f(cp.a)} + ${H}`)], 'ok',
    `<p>L'acide est ${f(cp.a)} (le plus de H), la base est ${f(cp.b)}. L'acide libère un proton :</p>${calc(demi(cp))}`,
    { indices: { cote: `${H} s'écrit du côté de la base : c'est l'acide ${f(cp.a)} qui le libère.`, inv: `L'acide est ${f(cp.a)}, celui qui a le plus de H : il s'écrit à gauche.` } });
  // partie « couple d'une demi-équation » (écrite dans un sens ou dans l'autre)
  const choixCouple = (lettre, ecrite, cp) => choix(`${lettre}) ${ecrite} : quel est le couple acide / base ?`,
    [o('ok', couple(cp)), o('inv', `${f(cp.b)} / ${f(cp.a)}`)], 'ok',
    `<p>${f(cp.a)} a un H de plus : c'est l'acide ; ${f(cp.b)} est la base. Couple ${c(couple(cp))}.</p>`,
    { indices: { inv: `On écrit l'acide en premier : ${f(cp.a)}, celui qui a le plus de H.` } });
  // partie « règle du gamma »
  const gamma = (q, haut, bas, reactifs, eq, expl) => partieGamma({ haut, bas, reactifs },
    { q, correction: `${gammaFig(haut, bas, reactifs)}${calc(eq)}${expl ? `<p>${expl}</p>` : ''}` });
  const DEF_ACIDE = [o('ok', `une espèce capable de libérer un proton ${H}`), o('cap', `une espèce capable de capter un proton ${H}`), o('el', 'une espèce capable de céder un électron'), o('ph', 'une solution de pH supérieur à 7')];
  const IND_ACIDE = { cap: 'C\'est la définition d\'une base.', el: 'Les électrons, c\'est l\'oxydoréduction : un acide échange un proton H<sup>+</sup>.', ph: 'Une solution de pH supérieur à 7 est basique ; et on demande la définition d\'une espèce chimique.' };

  const GROUPES = [
    { id: 'couples', titre: 'Couples acide / base' },
    { id: 'reactions', titre: 'Réactions acido-basiques' },
    { id: 'ph', titre: 'Le pH' },
    { id: 'calculs', titre: 'pH et quantités de matière' },
    { id: 'bac', titre: 'Sujets de bac' },
  ];

  const EXERCICES = [
    /* ---------- Exercice 7 p. 201 ---------- */
    { id: '7', groupe: 'couples', titre: 'Exercice 7 p. 201', desc: 'Demi-équations et couples acide / base',
      contexte: `<p class="er-contexte"><b>1.</b> Après avoir identifié les acides et les bases de chacun des couples suivants, donne les demi-équations associées : a) HIO<sub>3</sub> / IO<sub>3</sub><sup>−</sup> ; b) C<sub>2</sub>H<sub>4</sub>O<sub>4</sub> / C<sub>2</sub>H<sub>3</sub>O<sub>4</sub><sup>−</sup> ; c) NH<sub>4</sub><sup>+</sup> / NH<sub>3</sub>.</p>
        <p class="er-contexte" style="margin-top:8px"><b>2.</b> Identifie les acides et les bases dans chacune des demi-équations suivantes, puis déduis-en les couples : a) CH<sub>3</sub>COOH ⇌ CH<sub>3</sub>COO<sup>−</sup> + ${H} ; b) CH<sub>3</sub>NH<sub>2</sub> + ${H} ⇌ CH<sub>3</sub>NH<sub>3</sub><sup>+</sup> ; c) PO<sub>4</sub><sup>3−</sup> + ${H} ⇌ HPO<sub>4</sub><sup>2−</sup>.</p>`,
      parties: () => [
        choixDemi('1. a', CP.HIO3), choixDemi('1. b', CP.OXA), choixDemi('1. c', CP.NH4),
        choixCouple('2. a', `CH<sub>3</sub>COOH ⇌ CH<sub>3</sub>COO<sup>−</sup> + ${H}`, CP.ACE),
        choixCouple('2. b', `CH<sub>3</sub>NH<sub>2</sub> + ${H} ⇌ CH<sub>3</sub>NH<sub>3</sub><sup>+</sup>`, CP.MA),
        choixCouple('2. c', `PO<sub>4</sub><sup>3−</sup> + ${H} ⇌ HPO<sub>4</sub><sup>2−</sup>`, CP.HPO4),
      ] },

    /* ---------- Exercice 8 p. 201 ---------- */
    { id: '8', groupe: 'couples', titre: 'Exercice 8 p. 201', desc: 'Base conjuguée, acide conjugué',
      contexte: `<p class="er-contexte"><b>1.</b> Donne la formule de la base conjuguée des acides suivants : a) acide nitrique HNO<sub>3</sub> ; b) acide phosphorique H<sub>3</sub>PO<sub>4</sub>.</p>
        <p class="er-contexte" style="margin-top:8px"><b>2.</b> Donne la formule de l'acide conjugué des bases suivantes : a) ion fluorure F<sup>−</sup> ; b) ion hydrogénophosphate HPO<sub>4</sub><sup>2−</sup>.</p>`,
      parties: () => [
        partieConjugue({ lignes: [
          { depart: CP.HNO3.a, cible: CP.HNO3.b, label: 'a) Base conjuguée de l\'acide nitrique HNO<sub>3</sub>' },
          { depart: CP.H3PO4.a, cible: CP.H3PO4.b, label: 'b) Base conjuguée de l\'acide phosphorique H<sub>3</sub>PO<sub>4</sub>' }] },
          { q: '1. Construis la base conjuguée de chaque acide.', correction: `<p>On enlève un ${H} à chaque acide (un H de moins, charge − 1) :</p>${calc(`a) ${c('NO<sub>3</sub><sup>−</sup>')} &nbsp;&nbsp; b) ${c('H<sub>2</sub>PO<sub>4</sub><sup>−</sup>')}`)}` }),
        partieConjugue({ lignes: [
          { depart: CP.HF.b, cible: CP.HF.a, label: 'a) Acide conjugué de l\'ion fluorure F<sup>−</sup>' },
          { depart: CP.H2PO4.b, cible: CP.H2PO4.a, label: 'b) Acide conjugué de l\'ion hydrogénophosphate HPO<sub>4</sub><sup>2−</sup>' }] },
          { q: '2. Construis l\'acide conjugué de chaque base.', correction: `<p>On ajoute un ${H} à chaque base (un H de plus, charge + 1) :</p>${calc(`a) ${c('HF')} &nbsp;&nbsp; b) ${c('H<sub>2</sub>PO<sub>4</sub><sup>−</sup>')}`)}<p>H<sub>2</sub>PO<sub>4</sub><sup>−</sup> est à la fois la base conjuguée de H<sub>3</sub>PO<sub>4</sub> et l'acide conjugué de HPO<sub>4</sub><sup>2−</sup> : c'est un ampholyte.</p>` }),
      ] },

    /* ---------- Exercice 10 p. 202 ---------- */
    { id: '10', groupe: 'reactions', titre: 'Exercice 10 p. 202', desc: 'Écrire quatre réactions avec la règle du gamma',
      contexte: `<p class="er-contexte">Écris l'équation acido-basique entre les espèces chimiques suivantes.</p>
        <ul class="er-liste"><li>a) Les ions oxonium H<sub>3</sub>O<sup>+</sup> et les ions hydroxyde HO<sup>−</sup> ; couples ${couple(CP.H3O)} et ${couple(CP.EAU)}.</li>
          <li>b) L'acide méthanoïque HCOOH et l'ammoniac NH<sub>3</sub> ; couples ${couple(CP.MET)} et ${couple(CP.NH4)}.</li>
          <li>c) Les ions éthanoate CH<sub>3</sub>COO<sup>−</sup> et les ions oxonium H<sub>3</sub>O<sup>+</sup> ; couples ${couple(CP.ACE)} et ${couple(CP.H3O)}.</li>
          <li>d) L'acide fluorhydrique HF et l'eau H<sub>2</sub>O ; couples ${couple(CP.HF)} et ${couple(CP.H3O)}.</li></ul>`,
      parties: () => [
        gamma('a) Réaction entre H<sub>3</sub>O<sup>+</sup> et HO<sup>−</sup>.', CP.H3O, CP.EAU, ['a1', 'b2'],
          'H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup> → H<sub>2</sub>O + H<sub>2</sub>O, soit H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup> → 2 H<sub>2</sub>O'),
        gamma('b) Réaction entre HCOOH et NH<sub>3</sub>.', CP.MET, CP.NH4, ['a1', 'b2'], 'HCOOH + NH<sub>3</sub> → HCOO<sup>−</sup> + NH<sub>4</sub><sup>+</sup>'),
        gamma('c) Réaction entre CH<sub>3</sub>COO<sup>−</sup> et H<sub>3</sub>O<sup>+</sup>.', CP.ACE, CP.H3O, ['b1', 'a2'], 'CH<sub>3</sub>COO<sup>−</sup> + H<sub>3</sub>O<sup>+</sup> → CH<sub>3</sub>COOH + H<sub>2</sub>O'),
        gamma('d) Réaction entre HF et H<sub>2</sub>O.', CP.HF, CP.H3O, ['a1', 'b2'], 'HF + H<sub>2</sub>O → F<sup>−</sup> + H<sub>3</sub>O<sup>+</sup>'),
      ] },

    /* ---------- Exercice 11 p. 202 ---------- */
    { id: '11', groupe: 'reactions', titre: 'Exercice 11 p. 202', desc: 'Acide nitrique et ammoniac',
      contexte: `<p class="er-contexte">a) Écris la réaction acido-basique attendue entre l'acide nitrique HNO<sub>3</sub> et l'ammoniac, qui est une base (NH<sub>3</sub>).</p>
        <p class="er-contexte" style="margin-top:8px">b) Quels sont les couples acide / base mis en jeu ?</p>`,
      parties: () => [
        partieConjugue({ lignes: [
          { depart: CP.HNO3.a, cible: CP.HNO3.b, label: `L'acide HNO<sub>3</sub> donne son ${H} : que devient-il ?` },
          { depart: CP.NH4.b, cible: CP.NH4.a, label: `La base NH<sub>3</sub> capte ce ${H} : que devient-elle ?` }] },
          { q: 'a) Construis les deux produits de la réaction (méthode directe).', correction: `<p>L'acide HNO<sub>3</sub> donne un ${H} à la base NH<sub>3</sub> :</p>${calc(c('HNO<sub>3</sub> + NH<sub>3</sub> → NO<sub>3</sub><sup>−</sup> + NH<sub>4</sub><sup>+</sup>'))}` }),
        choix('b) Quels sont les couples acide / base mis en jeu ?',
          [o('ok', `${couple(CP.HNO3)} et ${couple(CP.NH4)}`), o('reac', `HNO<sub>3</sub> / NH<sub>3</sub> et NH<sub>4</sub><sup>+</sup> / NO<sub>3</sub><sup>−</sup>`), o('inv', `NO<sub>3</sub><sup>−</sup> / HNO<sub>3</sub> et NH<sub>3</sub> / NH<sub>4</sub><sup>+</sup>`)], 'ok',
          `<p>Chaque réactif et le produit qu'il devient forment un couple : ${c(couple(CP.HNO3))} et ${c(couple(CP.NH4))}.</p>`,
          { indices: { reac: 'Les deux réactifs ne forment pas un couple : un couple, c\'est un réactif et le produit qu\'il devient.', inv: 'On écrit l\'acide en premier dans un couple.' } }),
      ] },

    /* ---------- Exercice 13 p. 202 ---------- */
    { id: '13', groupe: 'reactions', titre: 'Exercice 13 p. 202', desc: 'L\'eau, un ampholyte',
      contexte: `<p class="er-contexte">Certaines espèces chimiques peuvent se comporter à la fois comme un acide et comme une base : on les appelle des <i>ampholytes</i>.</p>
        <ul class="er-liste"><li>a) Quel est l'acide conjugué de l'eau H<sub>2</sub>O ?</li><li>b) Quelle est la base conjuguée de l'eau H<sub>2</sub>O ?</li>
          <li>c) Écris les deux couples et les demi-équations associées.</li><li>d) Écris l'équation acido-basique lorsqu'une molécule d'eau réagit avec une autre molécule d'eau.</li>
          <li>e) Quelle est la propriété chimique mise en évidence ?</li></ul>`,
      parties: () => [
        partieConjugue({ lignes: [{ depart: CP.H3O.b, cible: CP.H3O.a, label: 'Acide conjugué de l\'eau' }] },
          { q: 'a) Construis l\'acide conjugué de l\'eau.', correction: `<p>On ajoute un ${H} à H<sub>2</sub>O : ${c('H<sub>3</sub>O<sup>+</sup>')}, l'ion oxonium.</p>` }),
        partieConjugue({ lignes: [{ depart: CP.EAU.a, cible: CP.EAU.b, label: 'Base conjuguée de l\'eau' }] },
          { q: 'b) Construis la base conjuguée de l\'eau.', correction: `<p>On enlève un ${H} à H<sub>2</sub>O : ${c('HO<sup>−</sup>')}, l'ion hydroxyde.</p>` }),
        choix('c) Quels sont les deux couples de l\'eau ?',
          [o('ok', `${couple(CP.H3O)} et ${couple(CP.EAU)}`), o('inv', `H<sub>2</sub>O / H<sub>3</sub>O<sup>+</sup> et HO<sup>−</sup> / H<sub>2</sub>O`), o('un', 'H<sub>3</sub>O<sup>+</sup> / HO<sup>−</sup> seulement')], 'ok',
          `<p>Couples et demi-équations :</p>${calc(`${couple(CP.H3O)} : ${demi(CP.H3O)}<br>${couple(CP.EAU)} : ${demi(CP.EAU)}`)}`,
          { indices: { inv: 'Dans un couple, l\'acide (le plus de H) s\'écrit en premier.', un: 'H<sub>3</sub>O<sup>+</sup> et HO<sup>−</sup> diffèrent de deux H<sup>+</sup> : ils ne forment pas un couple. L\'eau appartient à deux couples.' } }),
        gamma('d) Une molécule d\'eau réagit avec une autre molécule d\'eau : écris la réaction avec la règle du gamma.', CP.H3O, CP.EAU, ['b1', 'a2'],
          'H<sub>2</sub>O + H<sub>2</sub>O → H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup>, soit 2 H<sub>2</sub>O → H<sub>3</sub>O<sup>+</sup> + HO<sup>−</sup>'),
        choix('e) Quelle est la propriété chimique mise en évidence ?',
          [o('ok', 'l\'eau est un ampholyte : elle est à la fois un acide et une base'), o('a', 'l\'eau est un acide'), o('b', 'l\'eau est une base')], 'ok',
          `<p>Une molécule d'eau joue le rôle d'acide (elle donne ${H}), l'autre celui de base (elle le capte) : l'eau est un ${c('ampholyte')}.</p>`,
          { indices: { a: 'Dans la réaction d), l\'une des deux molécules d\'eau capte un proton : elle joue aussi le rôle de base.', b: 'Dans la réaction d), l\'une des deux molécules d\'eau donne un proton : elle joue aussi le rôle d\'acide.' } }),
      ] },

    /* ---------- Exercice 9 p. 201 ---------- */
    { id: '9', groupe: 'ph', titre: 'Exercice 9 p. 201', desc: 'pH de survie des espèces aquatiques',
      contexte: `${figSurvie()}
        <p class="er-contexte"><b>1.</b> Calcule les concentrations en ions ${H3O} qui correspondent : a) à la disparition des brochets ; b) à la disparition des anguilles ; c) à la disparition des crevettes.</p>
        <p class="er-contexte" style="margin-top:8px"><b>2.</b> Détermine le pH minimal d'une eau dans laquelle l'espèce considérée peut survivre. a) La truite disparaît si ${CH} dépasse 1,0 × 10<sup>−5</sup> ${UNITE.c}. b) L'escargot des rivières disparaît si ${CH} dépasse 1,2 × 10<sup>−6</sup> ${UNITE.c}. c) L'écrevisse disparaît si ${CH} dépasse 3,2 × 10<sup>−6</sup> ${UNITE.c}. d) La grenouille disparaît si ${CH} dépasse 0,9 × 10<sup>−4</sup> ${UNITE.c}.</p>`,
      parties: () => {
        const lire = (lettre, qui, ph) => [
          nombre(`1. ${lettre}) Lis sur le graphique le pH auquel ${qui} disparaissent.`, 'pH =', ph, '', `<p>La barre s'arrête à ${c('pH = ' + fmt(ph, 1))}.</p>`, { tol: .051, dec: 1, rel: undefined,
            indice: 'L\'axe du pH va de 7,5 (à gauche) à 3,5 (à droite) ; une graduation vaut 0,1. Lis l\'abscisse de la fin de la barre.' }),
          scient(`1. ${lettre}) Calcule la concentration en ions ${H3O} correspondante.`, `${CH} =`, Hde(ph), UNITE.c,
            `${calc(`${CH} = 10<sup>−pH</sup> = 10<sup>−${fmt(ph, 1)}</sup> ≈ ${c(`${sci(Hde(ph), 2)} ${UNITE.c}`)}`)}`, { diag: v => diagH(v, ph) }),
        ];
        const pmin = (lettre, qui, cc, txt) => nombre(`2. ${lettre}) pH minimal pour ${qui} (une décimale).`, 'pH =', pHde(cc), '',
          `${calc(`pH = −log(${CH}) = −log(${txt}) ≈ ${c(fmt(pHde(cc), 1))}`)}<p>L'eau doit avoir un pH supérieur à ${fmt(pHde(cc), 1)} pour que ${qui} survive.</p>`,
          { tol: .051, dec: 1, rel: undefined, diag: v => diagPH(v, cc) });
        return [].concat(lire('a', 'les brochets', 5.0), lire('b', 'les anguilles', 4.4), lire('c', 'les crevettes', 5.9), [
          pmin('a', 'la truite', 1.0e-5, '1,0 × 10<sup>−5</sup>'), pmin('b', 'l\'escargot', 1.2e-6, '1,2 × 10<sup>−6</sup>'),
          pmin('c', 'l\'écrevisse', 3.2e-6, '3,2 × 10<sup>−6</sup>'), pmin('d', 'la grenouille', 0.9e-4, '0,9 × 10<sup>−4</sup>')]);
      } },

    /* ---------- Exercice 17 p. 203 ---------- */
    { id: '17', groupe: 'calculs', titre: 'Exercice 17 p. 203', desc: 'Un détartrant : l\'acide sulfamique',
      contexte: `<p class="er-contexte">L'acide sulfamique est utilisé comme détartrant et pour le nettoyage des appareils. Il a pour formule NH<sub>2</sub>SO<sub>3</sub>H. Un sachet de poudre pour détartrer une cafetière porte la seule indication « acide sulfamique : 1 g ». L'acide sulfamique réagit fortement avec l'eau.</p>
        <p class="er-contexte" style="margin-top:8px">Le tartre est composé principalement de carbonate de calcium CaCO<sub>3</sub>, qui réagit avec les ions oxonium selon la réaction :</p>
        ${calc(eqTexte(EQS.detartrage(), 2))}
        ${donnees([`couple ${couple(CP.H3O)}`, `masse molaire de l'acide sulfamique : M = 97,1 ${UNITE.M}`])}`,
      parties: () => {
        const M = methode({ especes: [{ f: 'NH<sub>2</sub>SO<sub>3</sub>H', coef: 1, nom: 'acide sulfamique' }], produits: 1, depart: { k: 0, m: 1.0, mTxt: '1,0', M: 97.1 },
          q: { schema: 'a) Place les données sur le schéma de la méthode (colonne de l\'acide sulfamique).', nA: 'a) Calcule la quantité de matière n correspondant à 1,0 g d\'acide sulfamique.' } });
        return M.parties.concat([
          choix('b) D\'après la théorie de Brønsted, un acide est :', DEF_ACIDE, 'ok', `<p>Un acide est une espèce capable de ${c(`libérer au moins un proton ${H}`)}.</p>`, { indices: IND_ACIDE }),
          partieConjugue({ lignes: [{ depart: CP.SULF.a, cible: CP.SULF.b, label: 'Base conjuguée de l\'acide sulfamique NH<sub>2</sub>SO<sub>3</sub>H' }] },
            { q: 'c) Construis la base conjuguée de l\'acide sulfamique.', correction: `<p>On enlève un ${H} : ${c('NH<sub>2</sub>SO<sub>3</sub><sup>−</sup>')}.</p>` }),
          choix('d) Une réaction acido-basique est :', [o('ok', `le transfert d'un proton ${H} d'un acide vers une base`), o('el', 'le transfert d\'électrons d\'un réducteur vers un oxydant'), o('inv', `le transfert d'un proton ${H} d'une base vers un acide`)], 'ok',
            `<p>Une réaction acido-basique est ${c(`le transfert d'un proton d'un acide vers une base`)}.</p>`,
            { indices: { el: 'C\'est la définition d\'une réaction d\'oxydoréduction.', inv: 'C\'est l\'acide qui libère le proton, la base qui le capte.' } }),
          gamma('e) Écris la réaction de l\'acide sulfamique avec l\'eau.', CP.SULF, CP.H3O, ['a1', 'b2'],
            'NH<sub>2</sub>SO<sub>3</sub>H + H<sub>2</sub>O → NH<sub>2</sub>SO<sub>3</sub><sup>−</sup> + H<sub>3</sub>O<sup>+</sup>'),
          choix('f) Quel ion est responsable de l\'acidité d\'une solution ?', [o('ok', `l'ion oxonium ${H3O}`), o('ho', `l'ion hydroxyde ${HO}`), o('s', 'l\'ion NH<sub>2</sub>SO<sub>3</sub><sup>−</sup>')], 'ok',
            `<p>L'ion ${c(`oxonium ${H3O}`)} : plus ${CH} est grande, plus la solution est acide.</p>`,
            { indices: { ho: 'Les ions hydroxyde HO<sup>−</sup> rendent une solution basique.', s: 'C\'est une base : la base conjuguée de l\'acide sulfamique.' } }),
          choix('g) D\'où proviennent les ions oxonium nécessaires au détartrage de la cafetière ?', [o('ok', 'de la réaction de l\'acide sulfamique avec l\'eau'), o('t', 'du tartre'), o('eau', 'de l\'eau seule')], 'ok',
            `<p>Les ions ${H3O} proviennent ${c('de la réaction de l\'acide sulfamique avec l\'eau')} (question e).</p>`,
            { indices: { t: 'Le tartre CaCO<sub>3</sub> <b>consomme</b> les ions oxonium (c\'est un réactif avec eux).', eau: 'L\'eau seule en contient très peu (pH 7) : c\'est l\'acide qui en forme beaucoup en réagissant avec l\'eau.' } }),
          choix('h) Quelles espèces chimiques sont produites lors de la réaction avec le carbonate de calcium ? Que peut-on en conclure ?',
            [o('ok', 'CO<sub>2</sub>, H<sub>2</sub>O et Ca<sup>2+</sup> : le tartre est éliminé'), o('r', 'CaCO<sub>3</sub> et H<sub>3</sub>O<sup>+</sup> : le tartre se forme'), o('co2', 'CO<sub>2</sub> seulement : le tartre reste')], 'ok',
            `<p>Il se forme du dioxyde de carbone gazeux, de l'eau et des ions calcium en solution : ${c('le tartre est éliminé')}.</p>`,
            { indices: { r: 'CaCO<sub>3</sub> et H<sub>3</sub>O<sup>+</sup> sont les réactifs, à gauche de la flèche.', co2: 'Lis tous les produits, à droite de la flèche : il y en a trois. Et le tartre, consommé, disparaît.' } }),
        ]);
      } },

    /* ---------- Exercice 20 p. 203 ---------- */
    { id: '20', groupe: 'calculs', titre: 'Exercice 20 p. 203', desc: 'Le pH d\'un aquarium de guppys',
      contexte: `<p class="er-contexte">Le guppy est un poisson populaire en aquariophilie car il s'adapte facilement à la plupart des eaux. Pour permettre une bonne adaptation, il est conseillé d'avoir une eau au pH compris entre 6,5 et 7,5. Dans un aquarium de 200 L, on peut introduire une vingtaine de guppys.</p>
        <p class="er-contexte" style="margin-top:8px">La mesure du pH de l'eau de l'aquarium donne 8,5. Pour adapter le pH, on dispose de 3 solutions de même concentration 1,0 × 10<sup>−2</sup> ${UNITE.c} : une solution d'hydroxyde de sodium, ou soude (Na<sup>+</sup> + HO<sup>−</sup>), une solution d'acide chlorhydrique (H<sub>3</sub>O<sup>+</sup> + Cl<sup>−</sup>) et une solution d'eau salée (Na<sup>+</sup> + Cl<sup>−</sup>).</p>`,
      parties: () => {
        const Hi = 3.2e-9, Hf = 3.2e-7, V = 200, ni = Hi * V, nf = Hf * V, n = 6.3e-5, cs = 1.0e-2, VmL = n / cs * 1000;
        return [
          choix('a) Le pH de l\'eau est 8,5. Cette eau est-elle acide ou basique ?', [o('b', 'basique'), o('a', 'acide'), o('n', 'neutre')], 'b',
            `<p>pH = 8,5 &gt; 7 : l'eau est ${c('basique')}.</p>`, { melanger: false, indices: { a: 'Une solution acide a un pH inférieur à 7.', n: 'Une solution neutre a un pH égal à 7.' } }),
          choix('b) Le taux d\'acidité de l\'eau est-il compatible avec le milieu de vie du guppy ?', [o('non', 'non : 8,5 est en dehors de l\'intervalle 6,5 à 7,5'), o('oui', 'oui : 8,5 est proche de 7,5')], 'non',
            `<p>8,5 n'est pas compris entre 6,5 et 7,5 : c'est ${c('incompatible')} avec le milieu de vie des guppys.</p>`, { melanger: false, indices: { oui: 'Le pH conseillé est compris entre 6,5 et 7,5 : 8,5 est en dehors.' } }),
          scient('c) Calcule la concentration en ions H<sub>3</sub>O<sup>+</sup> dans cette eau.', `${CH} =`, Hde(8.5), UNITE.c,
            calc(`${CH} = 10<sup>−pH</sup> = 10<sup>−8,5</sup> ≈ ${c(`3,2 × 10<sup>−9</sup> ${UNITE.c}`)}`), { diag: v => diagH(v, 8.5) }),
          choix('d) Quelle solution est la plus judicieuse pour adapter le pH ?', [o('hcl', 'l\'acide chlorhydrique'), o('soude', 'la soude'), o('sel', 'l\'eau salée')], 'hcl',
            `<p>Il faut abaisser le pH d'au moins une unité : il faut donc ajouter ${c('l\'acide')} (acide chlorhydrique), qui apporte des ions ${H3O}.</p>`,
            { indices: { soude: 'La soude est une base : elle ferait encore augmenter le pH.', sel: 'L\'eau salée ne contient ni acide ni base : elle ne fait pas baisser le pH.' } }),
          scient('e) On souhaite un pH de 6,5. Quelle sera alors la concentration en ions H<sub>3</sub>O<sup>+</sup> ?', `${CH} =`, Hde(6.5), UNITE.c,
            calc(`${CH} = 10<sup>−6,5</sup> ≈ ${c(`3,2 × 10<sup>−7</sup> ${UNITE.c}`)}`), { diag: v => diagH(v, 6.5) }),
          scient('f) Calcule la quantité d\'ions H<sub>3</sub>O<sup>+</sup> au départ, dans les 200 L.', 'n<sub>i</sub> =', ni, 'mol',
            calc(`n<sub>i</sub> = ${CH}<sub>i</sub> × V = 3,2 × 10<sup>−9</sup> ${UNITE.c} × 200 L = ${c('6,4 × 10<sup>−7</sup> mol')}`), { diag: v => (Math.abs(v - Hi / V) / (Hi / V) < .05 ? 'n = c × V : on multiplie par le volume.' : 'n<sub>i</sub> = [H<sub>3</sub>O<sup>+</sup>] × V, avec la concentration de la question c) et V = 200 L.') }),
          scient('f) Calcule la quantité d\'ions H<sub>3</sub>O<sup>+</sup> à atteindre, à pH 6,5.', 'n<sub>f</sub> =', nf, 'mol',
            calc(`n<sub>f</sub> = ${CH}<sub>f</sub> × V = 3,2 × 10<sup>−7</sup> ${UNITE.c} × 200 L = ${c('6,4 × 10<sup>−5</sup> mol')}`), { indice: 'n<sub>f</sub> = [H<sub>3</sub>O<sup>+</sup>] × V, avec la concentration de la question e).' }),
          scient('f) Quelle quantité d\'ions H<sub>3</sub>O<sup>+</sup> faut-il ajouter ?', 'n =', n, 'mol',
            calc(`n = n<sub>f</sub> − n<sub>i</sub> = 6,4 × 10<sup>−5</sup> − 6,4 × 10<sup>−7</sup> ≈ ${c('6,3 × 10<sup>−5</sup> mol')}`),
            { diag: v => (Math.abs(v - (nf + ni)) / (nf + ni) < .005 ? 'On cherche ce qu\'il faut ajouter : on soustrait ce qu\'il y a déjà, n = n<sub>f</sub> − n<sub>i</sub>.' : 'n = n<sub>f</sub> − n<sub>i</sub>.') }),
          nombre('f) Quel volume de solution d\'acide chlorhydrique faut-il ajouter, en mL ?', 'V =', VmL, 'mL',
            `${calc(`V = ${fr('n', 'c')} = ${fr('6,3 × 10<sup>−5</sup> mol', `1,0 × 10<sup>−2</sup> ${UNITE.c}`)} = 6,3 × 10<sup>−3</sup> L soit ${c('6,3 mL')}`)}`,
            { rel: .03, affiche: '6,3', diag: v => (Math.abs(v - VmL / 1000) < 1e-4 ? 'Ce volume est en litres : convertis-le en mL (1 L = 1 000 mL).' : diagV(v / 1000, n, cs)) }),
        ];
      } },

    /* ---------- Sujet de bac, exercice 4 (le maraîcher) ---------- */
    { id: 'A', groupe: 'bac', titre: 'Sujet de bac, exercice 4 : traitement de milieux biologiques naturels', desc: 'Relever le pH d\'un sol et de l\'eau d\'un bassin',
      contexte: `<p class="er-contexte">Un maraîcher possède un potager d'une superficie de 600 m<sup>2</sup> dont la terre est argileuse, de pH égal à 6,1. Le pH de sa terre est trop acide pour certaines cultures : il envisage de la traiter en y épandant une espèce chimique basique comme le carbonate de calcium CaCO<sub>3</sub> (amendement calcaire).</p>
        <p class="er-contexte" style="margin-top:8px"><b>Document 1 : quantité d'amendement calcaire à apporter selon le type de terre</b></p>
        <div class="ph-defile"><table class="ph-tableau"><thead><tr><th></th><th>Terre sableuse</th><th>Terre limoneuse</th><th>Terre argileuse ou humifère</th></tr></thead>
          <tbody><tr><th>Dose d'entretien pour monter le pH de 0,5 unité</th><td>150 g/m<sup>2</sup></td><td>300 g/m<sup>2</sup></td><td>450 g/m<sup>2</sup></td></tr>
            <tr><th>Dose corrective pour monter le pH de 1 unité</th><td>300 g/m<sup>2</sup></td><td>600 g/m<sup>2</sup></td><td>900 g/m<sup>2</sup></td></tr></tbody></table></div>
        <p class="er-contexte">Lors de l'épandage, CaCO<sub>3</sub> réagit avec les espèces acides du sol, notamment les ions oxonium : ${eqTexte(EQS.calcaire(), 2)}.</p>
        <p class="er-contexte" style="margin-top:8px"><b>Traitement de l'eau.</b> Le maraîcher souhaite arroser avec l'eau d'un bassin (surface 60 m<sup>2</sup>, profondeur moyenne 1,0 m, volume 60 m<sup>3</sup>) et envisage de porter son pH à celui du sol. Le pH mesuré de l'eau du bassin est 5,6. Il faut alors ajouter 1,3 mol de carbonate de calcium pour faire remonter le pH de l'eau du bassin jusqu'à 6,6.</p>
        ${donnees([`M(C) = 12 ${UNITE.M}`, `M(O) = 16 ${UNITE.M}`, `M(Ca) = 40 ${UNITE.M}`, 'n = m / M'])}`,
      parties: () => {
        const M8 = methode({ especes: EQS.calcaire(), produits: 2, depart: { k: 1, H: 2.5e-6, V: 60000, Vd: { v: 60, u: UNITE.m3 } },
          q: { schema: '8. Place les données sur le schéma de la méthode (colonne des ions oxonium).', nA: '8. Détermine la quantité d\'ions H<sub>3</sub>O<sup>+</sup> présents dans le bassin (V en litres).' } });
        return [
          choix('1. De combien faut-il relever le pH du sol ?', [o('05', 'de 0,5 unité (de 6,1 à 6,6)'), o('1', 'de 1 unité'), o('66', 'de 6,6 unités')], '05',
            '<p>Il faut faire passer le pH de 6,1 à 6,6 : gagner <b>0,5 unité</b> de pH.</p>', { melanger: false, indices: { 1: '6,6 − 6,1 = 0,5.', 66: 'On cherche l\'augmentation du pH : 6,6 − 6,1.' } }),
          choix('1. Quelle dose d\'amendement faut-il utiliser ?', [o('450', '450 g/m<sup>2</sup>'), o('900', '900 g/m<sup>2</sup>'), o('150', '150 g/m<sup>2</sup>')], '450',
            '<p>Terre argileuse, pH à relever de 0,5 unité : dose d\'entretien de <b>450 g/m<sup>2</sup></b>.</p>', { indices: { 900: 'Cette dose relève le pH de 1 unité : ici, 0,5 unité suffit.', 150: 'C\'est la dose pour une terre sableuse : la terre est argileuse.' } }),
          nombre('1. Calcule la masse d\'amendement calcaire à apporter sur les 600 m<sup>2</sup>, en kg.', 'm =', 270, 'kg',
            calc(`m = 450 g/m<sup>2</sup> × 600 m<sup>2</sup> = 270 000 g = ${c('270 kg')}`),
            { diag: v => (Math.abs(v - 270000) < 1 ? 'Ce résultat est en grammes : convertis-le en kg.' : Math.abs(v - 540) < 1 ? 'Tu as pris la dose corrective (900 g/m<sup>2</sup>) : 0,5 unité suffit.' : 'm = dose × surface = 450 × 600.') }),
          choix('2. Une espèce chimique acide est :', DEF_ACIDE, 'ok', `<p>Une espèce acide est une espèce capable de ${c(`libérer un proton ${H}`)}.</p>`, { indices: IND_ACIDE }),
          choix('3. Quel couple acide / base est mis en jeu avec les ions oxonium ? Quelle est l\'espèce acide ?',
            [o('ok', `${couple(CP.H3O)} ; l'acide est ${H3O}`), o('inv', `${couple(CP.H3O)} ; l'acide est H<sub>2</sub>O`), o('ca', 'CaCO<sub>3</sub> / Ca<sup>2+</sup> ; l\'acide est Ca<sup>2+</sup>')], 'ok',
            `<p>Couple ${c(couple(CP.H3O))}, dont l'espèce acide est ${c(H3O)} (le plus de H).</p>`,
            { indices: { inv: 'L\'acide est celui qui a le plus de H : H<sub>3</sub>O<sup>+</sup>.', ca: 'Ca<sup>2+</sup> et CaCO<sub>3</sub> ne diffèrent pas d\'un H<sup>+</sup> : ce n\'est pas un couple acide / base.' } }),
          choix('4. Pourquoi cette méthode permet-elle d\'augmenter le pH ?', [o('ok', `${H3O} est consommé : ${CH} diminue, donc le pH augmente`), o('forme', `${H3O} est formé, donc le pH augmente`), o('ca', 'Ca<sup>2+</sup> est formé, donc le pH augmente')], 'ok',
            `<p>La réaction consomme les ions ${H3O} : ${CH} diminue, donc ${c('le pH augmente')}.</p>`,
            { indices: { forme: `${H3O} est un réactif de cette réaction : il est consommé. Et former des ions ${H3O} ferait baisser le pH.`, ca: `Ce sont les ions ${H3O} qui fixent le pH : regarde ce qu'ils deviennent.` } }),
          choix('5. Quelle méthode expérimentale permet d\'estimer le pH de l\'eau du bassin ?', [o('ok', 'une mesure au pH-mètre'), o('v', 'une mesure au voltmètre'), o('b', 'une pesée')], 'ok',
            `<p>Le pH se mesure à l'aide d'un ${c('pH-mètre')} (ou s'estime avec du papier pH).</p>`, { indices: { v: 'Le voltmètre mesure une tension.', b: 'Une balance mesure une masse.' } }),
          choix('6. Exprime le pH d\'une solution en fonction de la concentration en ions H<sub>3</sub>O<sup>+</sup>.',
            [o('ok', `pH = −log(${CH})`), o('sig', `pH = log(${CH})`), o('p10', `pH = 10<sup>−${CH}</sup>`)], 'ok', calc(c(`pH = −log(${CH})`)),
            { indices: { sig: 'Il manque le signe − : le log d\'une concentration inférieure à 1 est négatif.', p10: 'C\'est la fonction log qui donne le pH ; 10<sup>x</sup> sert dans l\'autre sens.' } }),
          scient('7. Montre que la concentration en ions H<sub>3</sub>O<sup>+</sup> de l\'eau du bassin est d\'environ 2,5 × 10<sup>−6</sup> mol·L<sup>−1</sup> : calcule-la.', `${CH} =`, Hde(5.6), UNITE.c,
            calc(`${CH} = 10<sup>−pH</sup> = 10<sup>−5,6</sup> ≈ ${c(`2,5 × 10<sup>−6</sup> ${UNITE.c}`)}`), { diag: v => diagH(v, 5.6) }),
        ].concat(M8.parties, [
          nombre('9. Calcule la masse molaire de CaCO<sub>3</sub>.', 'M =', 100, UNITE.M, calc('M(CaCO<sub>3</sub>) = 40 + 12 + 3 × 16 = 100 g·mol<sup>−1</sup>'),
            { tol: .01, diag: v => (Math.abs(v - 68) < .1 ? 'Il y a trois atomes d\'oxygène : 3 × 16.' : 'M = M(Ca) + M(C) + 3 × M(O).') }),
          nombre('9. Calcule la masse de carbonate de calcium à ajouter à l\'eau du bassin.', 'm =', 130, 'g',
            calc(`n = ${fr('m', 'M')} donc m = n × M = 1,3 mol × 100 ${UNITE.M} = ${c('130 g')}`), { diag: v => diagMasse(v, 1.3, 100) }),
          choix('10. Compare les masses de carbonate de calcium pour le sol et pour l\'eau. Est-il pertinent de modifier le pH de l\'eau du bassin avant l\'arrosage ?',
            [o('non', '130 g est très faible devant 270 kg : ce n\'est pas nécessaire'), o('oui', '130 g est important : il faut traiter l\'eau avant d\'arroser')], 'non',
            `<p>130 g est ${c('très faible devant les 270 kg')} épandus sur le sol : le pH de l'eau d'arrosage n'aura presque pas d'influence sur celui du sol (n(${H3O}) = 0,15 mol est très faible). Ce n'est pas nécessaire.</p>`,
            { melanger: false, indices: { oui: 'Compare dans la même unité : 270 kg = 270 000 g, soit plus de 2 000 fois plus que 130 g.' } }),
        ]);
      } },

    /* ---------- Extrait de bac : carottes de glace ---------- */
    { id: 'B', groupe: 'bac', titre: 'Extrait de bac : enregistrement de l\'environnement', desc: 'Acides dans les carottes de glace',
      contexte: `<p class="er-contexte">En se déposant à la surface d'un glacier, les couches de neige enregistrent une multitude d'informations sur l'état de notre environnement. Elles contiennent des impuretés, comme des acides : acide sulfurique provenant de la combustion du charbon, acide nitrique provenant des émissions des sols agricoles ou de la transformation d'oxydes d'azote émis par les véhicules, acide fluorhydrique… Des analyses sont effectuées sur l'eau de l'échantillon de la carotte de glace.</p>
        <p class="er-contexte" style="margin-top:8px"><b>Acide carbonique.</b> Lorsque le dioxyde de carbone gazeux se dissout dans l'eau, on peut considérer, pour simplifier, qu'il s'associe à une molécule d'eau pour former l'acide carbonique.</p>
        ${donnees([`couples acide / base : HNO<sub>3</sub> / NO<sub>3</sub><sup>−</sup> ; ${couple(CP.H3O)} ; ${couple(CP.EAU)} ; H<sub>2</sub>CO<sub>3</sub> / HCO<sub>3</sub><sup>−</sup>`])}`,
      parties: () => [
        choix('1. Donne la définition d\'une espèce chimique acide.', DEF_ACIDE, 'ok', `<p>Un acide est une espèce chimique capable de ${c(`libérer un proton ${H}`)}.</p>`, { indices: IND_ACIDE }),
        gamma('2. Établis l\'équation de la réaction entre l\'acide nitrique HNO<sub>3</sub> et l\'eau.', CP.HNO3, CP.H3O, ['a1', 'b2'],
          'HNO<sub>3</sub> + H<sub>2</sub>O → H<sub>3</sub>O<sup>+</sup> + NO<sub>3</sub><sup>−</sup>'),
        scient('3. On mesure pH = 6,2. Calcule la concentration en ions H<sub>3</sub>O<sup>+</sup> de cet échantillon.', `${CH} =`, Hde(6.2), UNITE.c,
          calc(`${CH} = 10<sup>−pH</sup> = 10<sup>−6,2</sup> ≈ ${c(`6,3 × 10<sup>−7</sup> ${UNITE.c}`)}`), { diag: v => diagH(v, 6.2) }),
        choix('4. Par analogie avec l\'acide nitrique, comment l\'augmentation du taux de dioxyde de carbone dans l\'atmosphère se voit-elle sur le pH des carottes de glace ?',
          [o('ok', `plus de CO<sub>2</sub> dissous, donc plus d'acide carbonique, qui forme des ions ${H3O} : le pH diminue`), o('aug', `plus de CO<sub>2</sub> dissous, donc plus d'ions ${H3O} : le pH augmente`), o('rien', 'le CO<sub>2</sub> n\'a aucun effet sur le pH')], 'ok',
          `<p>Si le taux de CO<sub>2</sub> augmente, le CO<sub>2</sub> dissous augmente aussi ; l'acide carbonique formé réagit avec l'eau comme l'acide nitrique et produit des ions ${H3O}. ${CH} augmente, donc ${c('le pH diminue')} : on mesure une diminution du pH.</p>`,
          { indices: { aug: `${CH} et pH varient en sens inverse : plus d'ions ${H3O}, pH plus petit.`, rien: 'Le CO<sub>2</sub> dissous forme l\'acide carbonique H<sub>2</sub>CO<sub>3</sub>, un acide.' } }),
        choix('5. Cite le produit d\'une combustion qui a un impact important sur l\'environnement.', [o('ok', 'le dioxyde de carbone CO<sub>2</sub>'), o('o2', 'le dioxygène O<sub>2</sub>'), o('n2', 'le diazote N<sub>2</sub>')], 'ok',
          `<p>Le ${c('dioxyde de carbone CO<sub>2</sub>')}, gaz à effet de serre.</p>`, { indices: { o2: 'Le dioxygène est un réactif de la combustion, pas un produit.', n2: 'Le diazote de l\'air ne participe pas à la combustion.' } }),
        choix('6. Les énergies d\'origine fossile sont non renouvelables. Qu\'est-ce qu\'une énergie non renouvelable ?',
          [o('ok', 'une énergie dont la source se renouvelle moins vite qu\'on la consomme'), o('pol', 'une énergie qui pollue'), o('sol', 'une énergie qui ne vient pas du Soleil')], 'ok',
          `<p>Une énergie non renouvelable est ${c('une énergie dont la source se renouvelle moins vite que sa consommation')} (le pétrole, le charbon et le gaz ont mis des millions d'années à se former).</p>`,
          { indices: { pol: 'Une énergie renouvelable peut aussi avoir des inconvénients : la définition porte sur le renouvellement de la source.', sol: 'Le pétrole vient indirectement du Soleil (végétaux fossiles) : la définition porte sur la vitesse de renouvellement de la source.' } }),
      ] },
  ];

  window.AB.EXERCICES = EXERCICES;
  window.AB.GROUPES_EX = GROUPES;
})();
