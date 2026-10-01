/* ============================================================
   Banque de questions — application « Spectres et étoiles »
   BANQUE.module1() … BANQUE.module4() : 10 questions tirées au hasard,
   de difficulté croissante (voir assets du moteur : exo.js).
   ============================================================ */
(function () {
  'use strict';

  const E = window.SP.ELEMENTS;
  const milliers = window.EX.milliers;
  const hasard = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const choisir = t => t[Math.floor(Math.random() * t.length)];
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const nomMin = el => E[el].nom.toLowerCase();
  const deg = T => `${milliers(T)} °C`;

  /* ---------- Spectres ---------- */
  // raies d'absorption d'un élément : plus il est abondant (ab de 0,5 à 1), plus elles sont noires
  const absorbe = (raies, ab) => raies.map(([l, f]) => [l, Math.min(.95, ab * (.6 + .4 * f))]);
  const S = {
    emr: el => ({ fond: 'noir', emission: E[el].raies }),
    abr: el => ({ fond: 'continu', T: null, absorption: E[el].raies.map(([l]) => [l, .92]) }),
    emc: T => ({ fond: 'continu', T: T || choisir([5500, 6000, 7000]) }),
    abb: () => { const a = hasard(440, 590); return { fond: 'continu', T: null, bandes: [[a, a + hasard(50, 100), 1]] }; },
    etoile: (T, presents) => ({ fond: 'continu', T, absorption: [].concat(...presents.map(p => absorbe(p.raies, p.ab))) }),
  };

  /* ============================================================
     AIDES (même identifiant = même aide : payante si elle est réutilisée)
     ============================================================ */
  const miniSpectres = (liste) => (d) => {
    const g = document.createElement('div');
    g.className = 'sp-mini';
    d.appendChild(g);
    liste.forEach(([nom, o]) => window.EX.ligne(g, nom, Object.assign({ hauteur: 26, axe: false }, o)));
  };
  const A = {
    eaRappel: {
      id: 'ea-rappel', titre: 'rappel',
      html: `<p>Un <b>spectre d'émission</b> est celui de la lumière émise directement par une source : un corps chauffé (toutes les couleurs) ou une lampe spectrale (quelques raies colorées sur fond noir).</p>
        <p>Un <b>spectre d'absorption</b> est obtenu quand de la lumière blanche traverse une substance (gaz, solution colorée) qui absorbe certaines couleurs : elles sont remplacées par des <b>raies noires</b> ou une <b>bande noire</b> sur le fond coloré.</p>`,
      apres: miniSpectres([['Émission', S.emr('Hg')], ['Absorption', S.abr('Hg')]]),
    },
    eaVisuel: html => ({ id: 'ea-visuel', titre: 'regarde bien', html: `<p>${html}</p>` }),
    crRappel: {
      id: 'cr-rappel', titre: 'rappel',
      html: `<p>Un <b>spectre continu</b> contient toutes les couleurs, sans interruption, comme un arc-en-ciel (une large bande noire peut s'y ajouter si une solution colorée en absorbe une partie).</p>
        <p>Un <b>spectre de raies</b> ne contient que quelques raies fines : colorées sur fond noir (émission) ou noires sur fond coloré (absorption).</p>`,
      apres: miniSpectres([['Continu', S.emc(6000)], ['De raies', S.emr('Na')], ['De raies', S.abr('He')]]),
    },
    crVisuel: html => ({ id: 'cr-visuel', titre: 'regarde bien', html: `<p>${html}</p>` }),
    t4Rappel: {
      id: 't4-rappel', titre: 'les quatre types',
      html: '<p>Les quatre types de spectres :</p>',
      apres: miniSpectres([['Émission, continu', S.emc(6000)], ['Émission, de raies', S.emr('Hg')], ['Absorption, de raies', S.abr('Hg')], ['Absorption, continu', { fond: 'continu', T: null, bandes: [[500, 580, 1]] }]]),
    },
    t4Visuel: {
      id: 't4-visuel', titre: 'méthode',
      html: `<p>Pose-toi deux questions :</p><ol class="er-liste"><li>Y a-t-il des parties <b>noires sur un fond coloré</b> (raies ou bande) ? Si oui, c'est un spectre d'<b>absorption</b>, sinon d'<b>émission</b>.</li>
        <li>La lumière forme-t-elle <b>quelques raies fines</b> (spectre de raies), ou <b>une bande de couleurs continue</b> (spectre continu) ?</li></ol>`,
    },
    srcRappel: {
      id: 'src-rappel', titre: 'rappel',
      html: `<ul class="er-liste"><li>Un <b>corps chauffé</b> (filament, intérieur d'une étoile) émet un spectre <b>continu</b>.</li>
        <li>Un <b>gaz excité</b> (lampe spectrale) émet un spectre de <b>raies colorées</b>.</li>
        <li>De la lumière blanche qui traverse un <b>gaz froid</b> donne un spectre de <b>raies noires</b>.</li>
        <li>De la lumière blanche qui traverse une <b>solution colorée</b> ou un filtre donne une <b>bande noire</b>.</li></ul>`,
    },
    corrRappel: {
      id: 'corr-rappel', titre: 'rappel',
      html: '<p>Un élément chimique <b>absorbe exactement les radiations qu\'il est capable d\'émettre</b>. Les raies noires de son spectre d\'absorption sont donc aux <b>mêmes longueurs d\'onde</b> que les raies colorées de son spectre d\'émission.</p>',
    },
    corrVisuel: {
      id: 'corr-visuel', titre: 'méthode',
      html: '<p>Lis la longueur d\'onde de chaque raie colorée sur la graduation (en nm). Cherche ensuite le spectre dont les raies noires sont exactement aux mêmes valeurs : il doit y en avoir autant, au même endroit.</p>',
    },
    tRappel: {
      id: 't-rappel', titre: 'rappel',
      html: `<p>Plus un corps chauffé est <b>chaud</b>, plus son spectre <b>s'enrichit vers le violet</b>. Un corps peu chaud n'émet surtout que du rouge ; en chauffant, l'orange, le jaune, le vert, puis le bleu et le violet apparaissent et deviennent plus intenses. Pour un corps très chaud, le rouge devient relativement plus faible que le bleu.</p>`,
      apres: miniSpectres([[deg(1500), S.emc(1500)], [deg(3000), S.emc(3000)], [deg(6000), S.emc(6000)], [deg(20000), S.emc(20000)]]),
    },
    tVisuel: {
      id: 't-visuel', titre: 'repères', action: 'reperes',
      html: '<p>Sur chaque spectre, un trait blanc en pointillés indique où commence le spectre côté violet (quand il ne commence pas dès 400 nm), et la couleur du corps chauffé est dessinée à côté. Rappel : rouge (le moins chaud) → orange → jaune → blanc → bleu (le plus chaud).</p>',
    },
    coulRappel: {
      id: 'coul-rappel', titre: 'couleur et température',
      html: '<p>La couleur d\'une étoile dépend de sa température de surface. Du moins chaud au plus chaud : <b>rouge → orange → jaune → blanche → bleue</b>. Une étoile rouge émet surtout du rouge ; une étoile bleue est si chaude que son spectre est riche en bleu et en violet.</p>',
    },
    compRappel: {
      id: 'comp-rappel', titre: 'méthode',
      html: '<p>Déplace le curseur : le spectre du corps chauffé change. Compare surtout les <b>deux extrémités</b> des spectres : la partie violette et la partie rouge. Quand les deux spectres sont identiques, le corps chauffé a la même température que la surface de l\'étoile.</p>',
    },
    compVisuel: {
      id: 'comp-visuel', titre: 'guidage', action: 'guider',
      html: '<p>Sous le curseur, un message t\'indique maintenant si ton corps chauffé est plus chaud ou moins chaud que l\'étoile.</p>',
    },
    profRappel: {
      id: 'prof-rappel', titre: 'méthode',
      html: '<p>La courbe donne l\'intensité de la lumière émise pour chaque longueur d\'onde. Plus le corps est chaud, plus le sommet de la courbe est à gauche (vers le violet). Repère le <b>sommet de la courbe</b>, descends <b>verticalement</b> jusqu\'à l\'échelle violette et lis la température.</p>',
    },
    profVisuel: {
      id: 'prof-visuel', titre: 'repère du sommet', action: 'montrerMax',
      html: '<p>Le sommet de la courbe est maintenant marqué par un point, et un trait en pointillés descend jusqu\'à l\'échelle des températures.</p>',
    },
    elRappel: {
      id: 'el-rappel', titre: 'rappel',
      html: `<p>Un élément chimique absorbe exactement les radiations qu'il émet. Il est <b>présent</b> dans l'étoile si <b>chacune</b> de ses raies d'émission se retrouve, à la même longueur d'onde, sous forme de raie noire dans le spectre de l'étoile. S'il manque une seule de ses raies, il n'est pas présent.</p>
        <p>Coche un élément pour prolonger ses raies jusqu'au spectre de l'étoile, et utilise la règle pour comparer les longueurs d'onde.</p>`,
    },
    elVisuel: {
      id: 'el-visuel', titre: 'raies noires repérées', action: 'marquer',
      html: '<p>Chaque raie noire de l\'étoile est maintenant repérée par un triangle sous le spectre. Chacune doit correspondre à une raie d\'un élément coché, et chaque élément coché doit avoir toutes ses raies sur des raies noires.</p>',
    },
    abRappel: {
      id: 'ab-rappel', titre: 'rappel',
      html: '<p>Les raies d\'absorption d\'un élément sont <b>d\'autant plus noires</b> que cet élément est présent en <b>grande quantité</b> dans les couches superficielles de l\'étoile.</p>',
    },
    etRappel: {
      id: 'et-rappel', titre: 'la lumière d\'une étoile',
      html: `<p>Les <b>régions internes</b> d'une étoile, très chaudes, émettent un <b>spectre continu</b> : c'est le fond coloré, qui renseigne sur la température.</p>
        <p>Cette lumière traverse ensuite les <b>couches superficielles</b>, plus froides, qui contiennent des éléments chimiques à l'état d'atomes. Ces éléments <b>absorbent</b> certaines radiations : ce sont les <b>raies noires</b>, qui renseignent sur la composition de l'étoile.</p>`,
    },
  };

  /* ============================================================
     MODULE 1 : les types de spectres
     ============================================================ */
  const TYPES = {
    emc: { label: 'Émission, continu', ea: 'emission', cr: 'continu' },
    emr: { label: 'Émission, de raies', ea: 'emission', cr: 'raies' },
    abr: { label: 'Absorption, de raies', ea: 'absorption', cr: 'raies' },
    abb: { label: 'Absorption, continu (bande)', ea: 'absorption', cr: 'continu' },
  };
  const DESCRIPTION = {
    emc: 'toutes les couleurs, sans aucune partie noire : c\'est la lumière émise par un corps chauffé',
    emr: 'quelques raies colorées sur un fond noir : la source n\'émet que certaines couleurs',
    abr: 'toutes les couleurs sauf quelques raies noires : ces couleurs ont été absorbées par un gaz',
    abb: 'toutes les couleurs sauf une large bande noire : ces couleurs ont été absorbées par une solution colorée ou un filtre',
  };
  const ELS_RAIES = ['H', 'He', 'Na', 'Hg', 'Li', 'Ba', 'Ca'];
  const spectreType = (t, el) => (t === 'emc' ? S.emc() : t === 'abb' ? S.abb() : S[t](el || choisir(ELS_RAIES)));
  const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

  const SITU_EA = [
    ['On observe directement, avec un spectroscope, la lumière d\'une lampe à vapeur de sodium.', 'emission', 'La lumière vient directement de la source : c\'est un spectre d\'émission.'],
    ['On observe la lumière blanche d\'une lampe après qu\'elle a traversé une vapeur de sodium froide.', 'absorption', 'La lumière blanche a traversé un gaz qui en absorbe une partie : c\'est un spectre d\'absorption.'],
    ['On observe la lumière émise par le filament d\'une lampe à incandescence.', 'emission', 'La lumière vient directement du filament chauffé : c\'est un spectre d\'émission (continu).'],
    ['On observe la lumière blanche après qu\'elle a traversé une solution bleue de sulfate de cuivre.', 'absorption', 'La lumière blanche a traversé une solution qui absorbe certaines couleurs : c\'est un spectre d\'absorption.'],
    ['On observe la lumière des tubes au néon du plafond.', 'emission', 'La lumière vient directement du gaz excité dans les tubes : c\'est un spectre d\'émission.'],
  ];
  const SITU_CR = [
    ['La lumière du filament d\'une lampe à incandescence.', 'continu', 'Un corps chauffé émet toutes les couleurs : spectre continu.'],
    ['La lumière d\'une lampe spectrale à vapeur de mercure.', 'raies', 'Un gaz excité n\'émet que certaines couleurs : spectre de raies.'],
    ['La lumière d\'une plaque électrique chauffée au rouge.', 'continu', 'Un corps chauffé émet un spectre continu.'],
    ['La lumière d\'une lampe au néon.', 'raies', 'Un gaz excité émet un spectre de raies.'],
    ['La lumière émise par les régions internes, très chaudes, d\'une étoile.', 'continu', 'Ces régions se comportent comme un corps chauffé : spectre continu.'],
    ['La lumière blanche après la traversée d\'une vapeur froide d\'hydrogène.', 'raies', 'Le gaz absorbe seulement certaines couleurs : spectre de raies (d\'absorption).'],
  ];

  function qEA(t) {
    return {
      type: 'choix', theme: 'Émission ou absorption ?',
      consigne: 'Ce spectre est-il un spectre d\'émission ou un spectre d\'absorption ?',
      spectres: [{ nom: '', o: spectreType(t) }],
      options: [{ id: 'emission', label: 'Spectre d\'émission' }, { id: 'absorption', label: 'Spectre d\'absorption' }],
      bonne: TYPES[t].ea,
      explication: `On voit ${DESCRIPTION[t]}. C'est un spectre d'${TYPES[t].ea === 'emission' ? 'émission' : 'absorption'}.`,
      aides: [A.eaRappel, A.eaVisuel(`Ici, on voit ${DESCRIPTION[t].split(' : ')[0]}.`)],
    };
  }
  function qCR(t) {
    return {
      type: 'choix', theme: 'Continu ou de raies ?',
      consigne: 'Ce spectre est-il un spectre continu ou un spectre de raies ?',
      spectres: [{ nom: '', o: spectreType(t) }],
      options: [{ id: 'continu', label: 'Spectre continu' }, { id: 'raies', label: 'Spectre de raies' }],
      bonne: TYPES[t].cr,
      explication: `On voit ${DESCRIPTION[t]}. C'est un spectre ${TYPES[t].cr === 'continu' ? 'continu' : 'de raies'}.`,
      aides: [A.crRappel, A.crVisuel(t === 'abb'
        ? 'Ici, les couleurs forment une bande continue, interrompue par une large bande noire (pas par des raies fines).'
        : `Ici, on voit ${DESCRIPTION[t].split(' : ')[0]}.`)],
    };
  }

  function module1() {
    const qs = [];
    // 1 et 2 : émission ou absorption (un de chaque)
    const e = choisir(['emr', 'emc']), a = choisir(['abr', 'abb']);
    melanger([e, a]).forEach(t => qs.push(qEA(t)));
    // 3 : situation
    const s = choisir(SITU_EA);
    qs.push({
      type: 'choix', theme: 'Émission ou absorption ?',
      consigne: `${s[0]} Obtient-on un spectre d'émission ou un spectre d'absorption ?`,
      options: [{ id: 'emission', label: 'Spectre d\'émission' }, { id: 'absorption', label: 'Spectre d\'absorption' }],
      bonne: s[1], explication: s[2],
      aides: [A.eaRappel, A.eaVisuel('La lumière arrive-t-elle directement de la source (émission), ou a-t-elle traversé une substance qui en absorbe une partie (absorption) ?')],
    });
    // 4 et 5 : continu ou de raies
    const c = choisir(['emc', 'abb']), r = choisir(['emr', 'abr']);
    melanger([c, r]).forEach(t => qs.push(qCR(t)));
    // 6 : situation
    const s2 = choisir(SITU_CR);
    qs.push({
      type: 'choix', theme: 'Continu ou de raies ?',
      consigne: `${s2[0]} Son spectre est-il continu ou de raies ?`,
      options: [{ id: 'continu', label: 'Spectre continu' }, { id: 'raies', label: 'Spectre de raies' }],
      bonne: s2[1], explication: s2[2],
      aides: [A.crRappel, A.crVisuel('Un corps chauffé émet toutes les couleurs ; un gaz (qui émet ou qui absorbe) ne concerne que quelques couleurs bien précises.')],
    });
    // 7 et 8 : les quatre types
    melanger(Object.keys(TYPES)).slice(0, 2).forEach(t => qs.push({
      type: 'choix', theme: 'Les quatre types de spectres',
      consigne: 'Quel est le type de ce spectre ?',
      spectres: [{ nom: '', o: spectreType(t) }],
      options: Object.keys(TYPES).map(id => ({ id, label: TYPES[id].label })),
      bonne: t,
      explication: `${capital(DESCRIPTION[t])}. C'est un spectre d'${TYPES[t].label.toLowerCase().replace('émission, ', 'émission ').replace('absorption, ', 'absorption ')}.`,
      aides: [A.t4Rappel, A.t4Visuel],
    }));
    // 9 : une source → son spectre
    const el = choisir(['Na', 'Hg', 'H', 'He', 'Li']);
    const sources = {
      emc: `la lumière d'un corps chauffé à ${deg(6000)}`,
      emr: `la lumière d'une lampe spectrale à vapeur de ${nomMin(el)}`,
      abr: `la lumière blanche après la traversée d'une vapeur froide de ${nomMin(el)}`,
      abb: 'la lumière blanche après la traversée d\'une solution colorée',
    };
    const cible = choisir(Object.keys(TYPES)), ordre = melanger(Object.keys(TYPES));
    qs.push({
      type: 'choix', theme: 'Les quatre types de spectres',
      consigne: `Quel spectre obtient-on en observant ${sources[cible]} ?`,
      options: ordre.map((t, k) => ({ id: t, label: `Spectre ${LETTRES[k]}`, spectre: t === 'emc' ? S.emc(6000) : spectreType(t, el) })),
      bonne: cible,
      explication: `Pour ${sources[cible]}, on obtient un spectre d'${TYPES[cible].label.toLowerCase().replace(', ', ' ')} (${DESCRIPTION[cible].split(' : ')[0]}).`,
      aides: [A.srcRappel, A.t4Visuel],
    });
    // 10 : spectre d'absorption correspondant à un spectre d'émission
    const els = melanger(['H', 'He', 'Na', 'Hg', 'Li', 'Ba', 'Ca']).slice(0, 3);
    const opts = melanger(els);
    qs.push({
      type: 'choix', theme: 'Les quatre types de spectres',
      consigne: 'Voici le spectre d\'émission d\'un élément chimique. Quel est le spectre d\'absorption de ce même élément ?',
      spectres: [{ nom: 'Émission', o: S.emr(els[0]) }],
      options: opts.map((x, k) => ({ id: x, label: `Spectre ${LETTRES[k]}`, spectre: S.abr(x) })),
      bonne: els[0],
      explication: `Le spectre ${LETTRES[opts.indexOf(els[0])]} a ses raies noires exactement aux mêmes longueurs d'onde que les raies colorées du spectre d'émission (c'est le ${nomMin(els[0])}) : un élément absorbe les radiations qu'il est capable d'émettre.`,
      aides: [A.corrRappel, A.corrVisuel],
    });
    return qs;
  }

  /* ============================================================
     MODULE 2 : température d'un corps chauffé
     ============================================================ */
  const ECHELLE = [900, 1300, 1800, 2500, 3500, 5000, 7500, 12000];
  const COULEURS = [
    { id: 'rouge', label: 'Étoile rouge', T: 3000 },
    { id: 'orange', label: 'Étoile orange', T: 4200 },
    { id: 'jaune', label: 'Étoile jaune', T: 5600 },
    { id: 'blanche', label: 'Étoile blanche', T: 9500 },
    { id: 'bleue', label: 'Étoile bleue', T: 22000 },
  ];
  // indices croissants, espacés d'au moins « ecart » dans ECHELLE
  function tirerEchelle(n, ecart) {
    for (;;) {
      const ix = melanger(ECHELLE.map((_, i) => i)).slice(0, n).sort((a, b) => a - b);
      if (ix.every((v, k) => !k || v - ix[k - 1] >= ecart)) return ix.map(i => ECHELLE[i]);
    }
  }
  function qOrdre(temps, theme, quoi) {
    const items = melanger(temps.map((T, k) => ({ id: 't' + k, T })));
    items.forEach((it, k) => { it.label = `${quoi} ${LETTRES[k]}`; it.spectre = S.emc(it.T); });
    const ordre = temps.map((_, k) => 't' + k);
    return {
      type: 'ordre', theme,
      consigne: `Touche les spectres dans l'ordre des températures <b>croissantes</b> : d'abord celui du corps le moins chaud, à la fin celui du plus chaud.`,
      items, ordre,
      indice: 'Le spectre d\'un corps plus chaud s\'étend plus loin vers le violet, et son bleu est plus intense par rapport au rouge.',
      explication: `Du moins chaud au plus chaud : ${ordre.map(id => items.find(i => i.id === id).label).join(', ')} (${temps.map(deg).join(' ; ')}). Plus la température est élevée, plus le spectre s'enrichit vers le violet.`,
      aides: [A.tRappel, A.tVisuel],
    };
  }
  function qPlusChaud(T1, T2, theme, consigne, quoi) {
    const opts = melanger([T1, T2]), Tc = Math.max(T1, T2);
    return {
      type: 'choix', theme, consigne,
      options: opts.map((T, k) => ({ id: 't' + T, label: `${quoi} ${LETTRES[k]}`, spectre: S.emc(T) })),
      bonne: 't' + Tc,
      explication: `Le spectre ${LETTRES[opts.indexOf(Tc)]} s'étend plus loin vers le violet et contient plus de bleu : c'est le plus chaud (${deg(Tc)}, contre ${deg(Math.min(T1, T2))}).`,
      aides: [A.tRappel, A.tVisuel],
    };
  }
  function qComparateur(T, theme, o, nom) {
    return {
      type: 'comparateur', theme, T, o,
      consigne: `${nom ? `Voici le spectre de ${nom}.` : 'Voici le spectre de la lumière d\'une étoile.'} Règle la température du corps chauffé pour obtenir le même fond coloré, puis valide.`,
      explication: `La température de surface ${nom ? `de ${nom}` : 'de l\'étoile'} est d'environ ${deg(T)} (réponse acceptée à 15 % près).`,
      aides: [A.compRappel, A.compVisuel],
    };
  }
  function qProfil(T, theme, nom) {
    return {
      type: 'profil', theme, T,
      consigne: `Voici le profil d'intensité de la lumière ${nom ? `de ${nom}` : 'd\'une étoile'}. Lis sa température de surface sur l'échelle, sans calcul.`,
      explication: `Le sommet de la courbe correspond à une température de surface d'environ ${deg(T)} (réponse acceptée à 12 % près).`,
      aides: [A.profRappel, A.profVisuel],
    };
  }

  function module2() {
    const qs = [];
    // 1 : filament le plus chaud
    const [f1, f2] = choisir([[900, 1800], [1300, 2500], [1300, 3500]]);
    qs.push(qPlusChaud(f1, f2, 'Le plus chaud',
      'On augmente l\'intensité du courant qui traverse le filament d\'une lampe : il chauffe de plus en plus. Quel spectre correspond au filament le plus chaud ?', 'Spectre'));
    // 2 : étoile la plus chaude
    const [e1, e2] = choisir([[3500, 12000], [3000, 7500], [5000, 20000]]);
    qs.push(qPlusChaud(e1, e2, 'Le plus chaud', 'Voici les spectres (fond continu) de deux étoiles. Laquelle a la température de surface la plus élevée ?', 'Étoile'));
    // 3 et 4 : classer
    qs.push(qOrdre(tirerEchelle(3, 2), 'Classer selon la température', 'Spectre'));
    qs.push(qOrdre(tirerEchelle(4, 2), 'Classer selon la température', 'Étoile'));
    // 5 : couleurs des étoiles
    const cs = melanger(COULEURS).slice(0, 4).sort((a, b) => a.T - b.T);
    const its = melanger(cs).map(c => ({ id: c.id, label: c.label, etoile: c.T }));
    qs.push({
      type: 'ordre', theme: 'Couleur et température',
      consigne: 'Les étoiles n\'ont pas toutes la même couleur. Touche-les dans l\'ordre des températures de surface <b>croissantes</b>.',
      items: its, ordre: cs.map(c => c.id),
      indice: 'Une étoile rouge est peu chaude, une étoile bleue est très chaude.',
      explication: `Du moins chaud au plus chaud : ${cs.map(c => c.label.toLowerCase()).join(', ')}.`,
      aides: [A.coulRappel],
    });
    // 6 : spectre → couleur
    const trio = [COULEURS[0], COULEURS[2], COULEURS[4]], c = choisir(trio);
    qs.push({
      type: 'choix', theme: 'Couleur et température',
      consigne: 'Voici le fond continu du spectre d\'une étoile. Quelle est la couleur de cette étoile ?',
      spectres: [{ nom: '', o: S.emc(c.T) }],
      options: trio.map(x => ({ id: x.id, label: x.label, etoile: x.T })),
      bonne: c.id,
      explication: c.id === 'rouge' ? 'Le spectre est surtout rouge : le violet et le bleu sont très faibles. C\'est une étoile peu chaude, rouge.'
        : c.id === 'jaune' ? 'Toutes les couleurs sont présentes avec une intensité voisine, le jaune est intense : c\'est une étoile jaune, comme le Soleil.'
          : 'Le bleu et le violet sont intenses et le rouge est plus faible : c\'est une étoile très chaude, bleue.',
      aides: [A.tRappel, A.coulRappel],
    });
    // 7 et 8 : comparateur
    melanger([3000, 4000, 5500, 7500, 10000]).slice(0, 2).sort((a, b) => a - b)
      .forEach(T => qs.push(qComparateur(T, 'Lire une température : comparer les spectres')));
    // 9 et 10 : profil
    melanger([2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000]).slice(0, 2)
      .forEach(T => qs.push(qProfil(T, 'Lire une température : profil d\'intensité')));
    return qs;
  }

  /* ============================================================
     MODULE 3 : composition d'une étoile
     ============================================================ */
  const POOL = ['H', 'He', 'Na', 'Mg', 'Ca', 'Fe', 'Hg', 'Li', 'K', 'Ba'];
  const ref = id => ({ id, nom: E[id].nom, raies: E[id].raies });
  // un élément absent doit avoir au moins une raie éloignée (≥ 5 nm) de toutes les raies de l'étoile
  const distinct = (raies, lignes) => raies.some(([l]) => lignes.every(m => Math.abs(m - l) >= 5));
  const ABONDANCES = { 1: [1], 2: [1, .7], 3: [1, .8, .62] };

  // tirage : nP éléments présents parmi nC candidats (parmi « pool »), T : température de l'étoile
  function composition(nP, nC, T, pool, obligatoires) {
    for (let essai = 0; essai < 500; essai++) {
      const ob = obligatoires || [];
      const presents = ob.concat(melanger((pool || POOL).filter(x => !ob.includes(x))).slice(0, nP - ob.length));
      const autres = melanger(POOL.filter(x => !presents.includes(x))).slice(0, nC - nP);
      const ab = melanger(ABONDANCES[nP]);
      const p = presents.map((id, k) => Object.assign(ref(id), { ab: ab[k] }));
      const lignes = [].concat(...p.map(x => x.raies.map(r => r[0])));
      if (!autres.every(id => distinct(E[id].raies, lignes))) continue;
      return { presents, refs: melanger(presents.concat(autres)).map(ref), o: S.etoile(T, p), p };
    }
    throw new Error('composition impossible');
  }
  function qElements(c, theme, consigne, nom) {
    const noms = c.presents.map(id => c.refs.find(r => r.id === id).nom.toLowerCase());
    return {
      type: 'elements', theme, consigne, o: c.o, refs: c.refs, presents: c.presents,
      explication: `${nom ? `${capital(nom)} contient` : 'L\'étoile contient'} : ${noms.join(', ')}. Toutes leurs raies se retrouvent en raies noires dans le spectre${c.refs.length > c.presents.length ? ' ; chacun des autres éléments a au moins une raie absente du spectre de l\'étoile' : ''}.`,
      aides: [A.elRappel, A.elVisuel],
    };
  }
  // deux éléments fictifs X et Y sans raie commune
  function elementsXY() {
    const tirer = (evite) => {
      for (;;) {
        const r = [];
        while (r.length < 5) {
          const l = hasard(410, 760);
          if (r.every(m => Math.abs(m - l) >= 18) && evite.every(m => Math.abs(m - l) >= 8)) r.push(l);
        }
        return r.sort((a, b) => a - b).map(l => [l, .5 + Math.random() * .5]);
      }
    };
    const X = tirer([]), Y = tirer(X.map(r => r[0]));
    return [{ id: 'X', nom: 'Élément X', raies: X }, { id: 'Y', nom: 'Élément Y', raies: Y }];
  }

  function module3() {
    const qs = [];
    const Tq = () => choisir([4500, 5000, 5500, 6000, 6500, 7000, 8000]);
    // 1 : un élément parmi deux
    qs.push(qElements(composition(1, 2, Tq()), 'Un élément parmi deux',
      'Les couches superficielles de cette étoile ne contiennent qu\'un seul des deux éléments proposés. Coche celui qui est présent.'));
    // 2 : X ou Y (comme dans le TP)
    const xy = elementsXY(), pres = choisir(['X', 'Y']);
    const px = Object.assign({}, xy.find(r => r.id === pres), { ab: 1 });
    qs.push(qElements({ presents: [pres], refs: xy, o: S.etoile(Tq(), [px]) }, 'Un élément parmi deux',
      'On sait que la couche superficielle de cette étoile n\'est constituée que d\'un seul élément, X ou Y. Coche celui qui est présent.'));
    // 3 à 5 : deux éléments parmi quatre
    for (let i = 0; i < 3; i++) qs.push(qElements(composition(2, 4, Tq()), 'Deux éléments parmi quatre', 'Coche les éléments présents dans les couches superficielles de cette étoile.'));
    // 6 à 8 : trois éléments parmi six
    for (let i = 0; i < 3; i++) qs.push(qElements(composition(3, 6, Tq()), 'Trois éléments parmi six', 'Coche les éléments présents dans les couches superficielles de cette étoile (il y en a peut-être trois).'));
    // 9 : élément le plus abondant
    const c = composition(2, 2, Tq());
    const plus = c.p.slice().sort((a, b) => b.ab - a.ab)[0].id;
    qs.push({
      type: 'choix', theme: 'L\'élément le plus abondant',
      consigne: 'Cette étoile contient deux éléments chimiques. Lequel est présent en plus grande quantité dans ses couches superficielles ?',
      spectres: [{ nom: 'Étoile', o: c.o }].concat(c.presents.map(id => ({ nom: E[id].nom, o: { fond: 'noir', emission: E[id].raies, hauteur: 30, axe: false } }))),
      options: c.presents.map(id => ({ id, label: E[id].nom })),
      bonne: plus,
      explication: `Les raies du ${nomMin(plus)} sont les plus noires : c'est l'élément le plus abondant dans les couches superficielles de l'étoile.`,
      aides: [A.abRappel],
    });
    // 10 : trois parmi six
    qs.push(qElements(composition(3, 6, Tq()), 'Trois éléments parmi six', 'Coche les éléments présents dans les couches superficielles de cette étoile.'));
    return qs;
  }

  /* ============================================================
     MODULE 4 : bilan, mission astronome
     (températures réelles approchées, compositions simplifiées)
     ============================================================ */
  const ETOILES = {
    froide: [['Bételgeuse', 3300], ['Antarès', 3100], ['Aldébaran', 3600], ['Arcturus', 4000]],
    moyenne: [['le Soleil', 5500], ['Procyon', 6300], ['Capella', 4700]],
    chaude: [['Sirius', 9700], ['Véga', 9300], ['Rigel', 11800], ['Spica', 22000]],
  };
  const COMPO = {
    froide: { pool: ['Ca', 'Fe', 'Na', 'Mg'], n: 2, ob: [] },
    moyenne: { pool: ['Na', 'Mg', 'Ca', 'Fe'], n: 3, ob: ['H'] },
    chaude: { pool: ['He', 'Mg'], n: 2, ob: ['H'] },
  };

  function module4() {
    const stars = melanger(['froide', 'moyenne', 'chaude']).map(k => {
      const [nom, T] = choisir(ETOILES[k]);
      const c = composition(COMPO[k].n, k === 'moyenne' ? 5 : 4, T, COMPO[k].pool, COMPO[k].ob);
      return { k, nom, T, c, Nom: capital(nom) };
    });
    // méthode de lecture de la température : profil pour une étoile pas trop chaude, comparateur sinon
    const tiedes = stars.filter(s => s.k !== 'chaude');
    const auProfil = choisir(tiedes);
    const qs = [];
    const temperature = s => (s === auProfil
      ? qProfil(s.T, `${s.Nom} · Température`, s.nom)
      : qComparateur(s.T, `${s.Nom} · Température`, s.c.o, s.nom));
    const [s1, s2, s3] = stars;
    // étoile 1 : type de spectre
    qs.push({
      type: 'choix', theme: `${s1.Nom} · Type de spectre`,
      consigne: `Voici le spectre de la lumière de ${s1.nom}. De quel type est ce spectre ?`,
      spectres: [{ nom: s1.Nom, o: s1.c.o }],
      options: Object.keys(TYPES).map(id => ({ id, label: TYPES[id].label })),
      bonne: 'abr',
      explication: 'Des raies noires sur un fond coloré continu : c\'est un spectre d\'absorption de raies. Le fond continu est émis par les régions internes de l\'étoile, les raies noires sont dues aux éléments de ses couches superficielles.',
      aides: [A.t4Rappel, A.etRappel],
    });
    qs.push(temperature(s1));
    qs.push(qElements(s1.c, `${s1.Nom} · Composition`, `Quels éléments chimiques sont présents dans les couches superficielles de ${s1.nom} ?`, s1.nom));
    // étoile 2 : origine du fond continu
    qs.push({
      type: 'choix', theme: `${s2.Nom} · Le fond continu`,
      consigne: `Voici le spectre de ${s2.nom}. D'où provient le fond coloré continu de ce spectre ?`,
      spectres: [{ nom: s2.Nom, o: s2.c.o }],
      options: melanger([
        { id: 'int', label: 'Des régions internes de l\'étoile, très chaudes' },
        { id: 'sup', label: 'Des éléments chimiques des couches superficielles' },
        { id: 'terre', label: 'De l\'atmosphère de la Terre' },
      ]),
      bonne: 'int',
      explication: 'Les régions internes, très chaudes, se comportent comme un corps chauffé : elles émettent un spectre continu. C\'est lui qui renseigne sur la température de l\'étoile.',
      aides: [A.etRappel],
    });
    qs.push(temperature(s2));
    qs.push(qElements(s2.c, `${s2.Nom} · Composition`, `Quels éléments chimiques sont présents dans les couches superficielles de ${s2.nom} ?`, s2.nom));
    // étoile 3 : origine des raies noires
    qs.push({
      type: 'choix', theme: `${s3.Nom} · Les raies noires`,
      consigne: `Voici le spectre de ${s3.nom}. Pourquoi observe-t-on des raies noires ?`,
      spectres: [{ nom: s3.Nom, o: s3.c.o }],
      options: melanger([
        { id: 'abs', label: 'Les éléments des couches superficielles absorbent certaines radiations' },
        { id: 'em', label: 'Les régions internes de l\'étoile émettent des raies noires' },
        { id: 'trou', label: 'Certaines zones de l\'étoile n\'émettent aucune lumière' },
      ]),
      bonne: 'abs',
      explication: 'La lumière émise par les régions internes traverse les couches superficielles, plus froides : leurs éléments chimiques absorbent les radiations qu\'ils seraient capables d\'émettre. Ces raies noires renseignent sur la composition de l\'étoile.',
      aides: [A.etRappel],
    });
    qs.push(temperature(s3));
    qs.push(qElements(s3.c, `${s3.Nom} · Composition`, `Quels éléments chimiques sont présents dans les couches superficielles de ${s3.nom} ?`, s3.nom));
    // classement des trois étoiles
    const tri = stars.slice().sort((a, b) => a.T - b.T);
    qs.push({
      type: 'ordre', theme: 'Classer les trois étoiles',
      consigne: 'Touche les spectres des trois étoiles dans l\'ordre des températures de surface <b>croissantes</b>.',
      items: melanger(stars).map(s => ({ id: s.nom, label: s.Nom, spectre: { fond: 'continu', T: s.T, absorption: s.c.o.absorption } })),
      ordre: tri.map(s => s.nom),
      indice: 'Compare le fond coloré : plus l\'étoile est chaude, plus son spectre est riche en bleu et en violet.',
      explication: `Du moins chaud au plus chaud : ${tri.map(s => `${s.nom} (${deg(s.T)})`).join(', ')}.`,
      aides: [A.tRappel, A.tVisuel],
    });
    return qs;
  }

  window.BANQUE = { module1, module2, module3, module4, A, S, composition };
})();
