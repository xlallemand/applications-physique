/* ============================================================
   Module 3 : « Entraînement » (série notée sur 20)
   (application « Chromatographie sur couche mince »)

   CC.questionsSerie() → 10 questions tirées au hasard :
     6 chromatogrammes avec les vrais noms (menthe poivrée, pastille,
       orange, médicaments ; 2 à 4 références, 1 à 3 dépôts à analyser),
       conclusions construites avec des expressions à piocher (dont
       « identifier toutes les espèces » du dépôt) ;
     1 schéma à légender ; 2 questions sur le principe et la révélation
     des espèces incolores ; 1 « Que signifie CCM ? ».
   CC.FAMILLES                  fabriques des chromatogrammes (réutilisables)
   Utilise CCM (ccm.js), CC.chromato, CC.phrase, CC.legende (cc.js).
   ============================================================ */
(function () {
  'use strict';

  const E = CCM.ESPECES;
  const { melanger, hasard, entre } = CC;

  /* ---------- Fabrication d'une plaque ----------
     refs : identifiants des espèces de référence ; autres : dépôts à analyser
     lettres : vrai → chaque dépôt garde sa lettre (d.lettre) ; sinon numéros 1, 2, 3… */
  function plaque(refs, autres, lettres) {
    const items = melanger(refs.map(id => ({ id, ref: true, especes: [id], legende: E[id].nom, lettre: E[id].nom[0].toUpperCase() })).concat(autres));
    const depots = items.map((it, i) => Object.assign({}, it, { nom: lettres ? it.lettre : String(i + 1) }));
    const sit = { depots, refs: [], legende: true };
    depots.forEach((x, i) => { if (x.ref) sit.refs.push(i); });
    sit.analyses = depots.map((x, i) => i).filter(i => !depots[i].ref);
    return sit;
  }
  // questions possibles sur une plaque (sans 'pur' ni 'nombre' pour les médicaments ;
  // 'constituants' : identifier toutes les espèces, quand au moins 2 références sont présentes)
  function candidates(sit, sansPur) {
    const l = [];
    sit.analyses.forEach(a => {
      if (!sansPur) l.push({ type: 'pur', depot: a });
      if (!sansPur && CCM.hauteursDe(sit.depots[a]).length >= 3) l.push({ type: 'nombre', depot: a });
      if (CC.analyse({ depot: a }, sit).presentes.length >= 2) l.push({ type: 'constituants', depot: a });
      sit.refs.forEach(r => l.push({ type: 'contient', depot: a, ref: r }));
      sit.depots[a].especes.forEach(s => l.push({ type: 'tache', depot: a, espece: s }));
    });
    if (!sansPur) l.push({ type: 'pur', depot: hasard(sit.refs) });
    return l;
  }
  // deux questions de types différents (« identifier toutes les espèces » souvent la première, quand elle est possible)
  function deux(l) {
    const m = melanger(l), t = m.find(q => q.type === 'constituants');
    const a = t && Math.random() < .6 ? t : m[0];
    return [a, m.find(q => q.type !== a.type) || m.find(q => q !== a)];
  }
  // une partie « phrase » sur le chromatogramme ch (créé par la figure)
  function partiePhrase(sit, q, figure) {
    return {
      type: 'perso', q: CC.enonce(q, sit), solution: CC.reponse(q, sit), situation: sit, question: q,
      monter(zone, api) {
        const ch = figure.ch;
        ch.effacer();
        ch.marquer(q.type === 'tache' ? q.depot + '|' + q.espece : null);
        return CC.phrase(zone, {
          situation: sit, q, montrer: c => ch.montrer(c),
          onMessage: m => (m ? api.message(m) : api.effacer()),
          onErreur: api.erreur, onReussi: () => api.reussi(),
        });
      },
    };
  }
  // question complète sur un chromatogramme
  function questionChromato(theme, enonce, sit, qs, extra) {
    const figure = { ch: null };
    return {
      theme, consigne: 'Analyse le chromatogramme en justifiant toujours.', enonce,
      figure(z) { z.classList.add('cc-serie-fig'); figure.ch = CC.chromato(z, sit); },
      parties: qs.map(q => partiePhrase(sit, q, figure)).concat(extra || []),
    };
  }
  const aide = '<p class="cc-aide">Touche les taches : des pointillés relient celles de même hauteur.</p>';

  /* ---------- Familles de chromatogrammes ---------- */
  const FAMILLES = {
    menthe() {
      const refs = melanger(['menthone', 'menthol', 'eucalyptol', 'menthofuranne']).slice(0, entre(2, 4));
      const sit = plaque(refs, [{ especes: ['menthol', 'menthone', 'menthofuranne', 'u1', 'u2'], legende: 'huile essentielle de menthe poivrée', sujet: 'L\'huile essentielle', pronom: 'elle' }]);
      return questionChromato('Huile essentielle de menthe poivrée', `<p>On extrait l'huile essentielle de la menthe poivrée, puis on l'analyse par chromatographie avec des espèces de référence.</p>${aide}`, sit, deux(candidates(sit)));
    },
    pastille() {
      const refs = melanger(['citral', 'menthol', 'eucalyptol', 'limonene']).slice(0, entre(2, 4));
      const sit = plaque(refs, [{ especes: ['menthol', 'eucalyptol', 'u1', 'u3', 'u4'], legende: 'solution S de la pastille', sujet: 'La pastille', pronom: 'elle', lettre: 'S' }], true);
      return questionChromato('Pastille rafraîchissante', `<p>Une pastille est broyée puis dissoute dans un solvant : c'est la solution S. On la compare à des espèces de référence, toutes incolores, révélées sous la lampe UV.</p>${aide}`, sit, deux(candidates(sit)));
    },
    orange() {
      const refs = melanger(['limonene', 'carvone', 'myrcene', 'citral']).slice(0, entre(2, 4));
      const sit = plaque(refs, [{ especes: ['limonene', 'citral', 'myrcene', 'u5'], legende: 'huile essentielle d\'orange', sujet: 'L\'huile essentielle', pronom: 'elle' }]);
      return questionChromato('Huile essentielle d\'orange', `<p>On analyse l'huile essentielle d'orange par chromatographie avec des espèces de référence.</p>${aide}`, sit, deux(candidates(sit)));
    },
    medicaments() {
      const MED = [
        { especes: ['ibuprofene'], legende: 'Brufen 400', sujet: 'Le Brufen 400', pronom: 'il' },
        { especes: ['aspirine'], legende: 'Aspirine UPSA', sujet: 'L\'Aspirine UPSA', pronom: 'elle' },
        { especes: ['paracetamol'], legende: 'Doliprane 500', sujet: 'Le Doliprane 500', pronom: 'il' },
      ];
      const n = entre(1, 3), meds = n === 3 ? MED : melanger(MED).slice(0, n);
      const sit = plaque(['ibuprofene', 'aspirine', 'paracetamol'], meds.map(m => Object.assign({}, m)));
      const enonce = `<p>Trois médicaments contre la douleur. On dissout chacun dans un peu d'éthanol, puis on compare par chromatographie à l'ibuprofène, à l'aspirine et au paracétamol.</p>${aide}`;
      if (n < 3) return questionChromato('Médicaments', enonce, sit, deux(candidates(sit, true)));
      // les trois médicaments : une conclusion, puis « je suis allergique à l'aspirine »
      const q1 = hasard(candidates(sit, true));
      return questionChromato('Médicaments', enonce, sit, [q1], [{
        type: 'choix', q: 'Je suis allergique à l\'aspirine : quel(s) médicament(s) puis-je utiliser ?', colonne: true, bonne: 'bd',
        options: [{ id: 'bd', label: 'Le Brufen 400 et le Doliprane 500' }, { id: 'd', label: 'Le Doliprane 500 seulement' },
          { id: 'a', label: 'L\'Aspirine UPSA seulement' }, { id: 't', label: 'Les trois médicaments' }],
        indices: {
          d: 'Le Brufen 400 ne donne pas de tache à la même hauteur que l\'aspirine : il n\'en contient pas, tu peux le prendre aussi.',
          a: 'L\'Aspirine UPSA donne une tache à la même hauteur que l\'aspirine : elle en contient, c\'est celle qu\'il faut éviter.',
          t: 'L\'Aspirine UPSA donne une tache à la même hauteur que l\'aspirine : elle en contient.',
        },
        solution: 'Seule l\'Aspirine UPSA donne une tache à la même hauteur que l\'aspirine. Le Brufen 400 et le Doliprane 500 n\'en contiennent pas.',
      }]);
    },
  };

  /* ---------- Schéma à légender ---------- */
  function questionLegende() {
    return {
      theme: 'Schéma de la CCM', consigne: 'Légende le schéma du dispositif de chromatographie.',
      parties: [{
        type: 'perso',
        monter: (zone, api) => CC.legende(zone, { onPose: () => api.effacer(), onErreur: d => api.erreur(d), onReussi: () => api.reussi() }),
        solution: 'Couvercle, cuve à élution, phase stationnaire (la plaque), front de l\'éluant, dépôts, trait de dépôt, éluant (phase mobile).',
      }],
    };
  }

  /* ---------- Principe et révélation (QCM) ---------- */
  const choix = (theme, q, bonne, mauvais, solution) => ({
    theme, parties: [{ type: 'choix', q, colonne: true, bonne: 'b',
      options: [{ id: 'b', label: bonne }].concat(mauvais.map((m, i) => ({ id: 'm' + i, label: m[0] }))),
      indices: Object.fromEntries(mauvais.map((m, i) => ['m' + i, m[1]])), solution }],
  });
  const UV = () => choix('Révéler les espèces incolores', 'Les espèces déposées sont incolores. Comment les voir sur le chromatogramme ?',
    'On place la plaque sous une lampe UV et on entoure les taches au crayon.',
    [['On chauffe la plaque.', 'Chauffer la plaque ne fait pas apparaître les taches : les espèces incolores se voient sous une lampe UV.'],
     ['On attend que l\'éluant sèche.', 'Une fois sèche, la plaque reste blanche : les espèces incolores restent invisibles hors de la lampe UV.'],
     ['On repasse les taches au crayon dès la sortie de la cuve.', 'On ne voit pas les taches incolores à la sortie de la cuve : il faut d\'abord les révéler sous une lampe UV.']],
    'Sous la lampe UV, les taches incolores apparaissent ; on les entoure au crayon, car elles disparaissent quand on éteint la lampe.');
  const PRINCIPE = () => choix('Principe de la CCM', 'Pourquoi les espèces d\'un mélange se séparent-elles sur la plaque ?',
    'L\'éluant monte en les entraînant, et chaque espèce est plus ou moins entraînée.',
    [['Elles montent toutes à la même vitesse que l\'éluant.', 'Si elles montaient toutes comme l\'éluant, elles resteraient ensemble au niveau du front : elles ne seraient pas séparées.'],
     ['Les espèces les plus lourdes tombent au fond de la cuve.', 'Les espèces ne tombent pas : elles sont entraînées vers le haut de la plaque par l\'éluant qui monte.'],
     ['Elles réagissent avec l\'éluant et se transforment.', 'Il n\'y a pas de transformation chimique : les espèces sont seulement entraînées, plus ou moins, par l\'éluant.']],
    CC.PRINCIPE);
  const AUTRES = [
    () => choix('Préparer la cuve', 'Pourquoi le trait de dépôt doit-il rester au-dessus du niveau de l\'éluant ?',
      'Sinon les dépôts se dissolvent dans l\'éluant de la cuve.',
      [['Sinon l\'éluant ne peut pas monter dans la plaque.', 'L\'éluant monte même s\'il recouvre le trait ; mais les dépôts se dissoudraient dans l\'éluant de la cuve.'],
       ['Sinon le trait au crayon s\'efface.', 'Le crayon ne s\'efface pas dans l\'éluant ; ce sont les dépôts qui se dissoudraient dans l\'éluant.']],
      'Le niveau de l\'éluant reste sous le trait de dépôt : sinon les dépôts se dissolvent dans l\'éluant au lieu de monter avec lui.'),
    () => choix('Préparer la cuve', 'Pourquoi ferme-t-on la cuve avec un couvercle, sous la hotte ?',
      'L\'éluant est toxique et s\'évapore.',
      [['Pour que la plaque reste bien droite.', 'Le couvercle ne tient pas la plaque : il empêche l\'éluant, toxique, de s\'évaporer.'],
       ['Pour que la lumière n\'efface pas les taches.', 'La lumière n\'efface pas les taches : le couvercle empêche l\'éluant, toxique, de s\'évaporer.']],
      'L\'éluant est un mélange de produits toxiques qui s\'évapore : la cuve reste fermée, sous la hotte.'),
    () => choix('Préparer la plaque', 'Pourquoi trace-t-on le trait de dépôt au crayon à papier, doucement ?',
      'La mine du crayon ne monte pas avec l\'éluant, et la couche de silice est fragile.',
      [['Au stylo, le trait serait trop fin.', 'L\'encre d\'un stylo monterait avec l\'éluant et ferait des taches ; le crayon, lui, reste en place.'],
       ['Le crayon rend les taches visibles sous la lampe UV.', 'Ce n\'est pas le crayon qui révèle les taches ; on l\'utilise car sa mine ne monte pas avec l\'éluant.']],
      'Au crayon à papier, doucement, sans creuser la fine couche de silice : la mine ne monte pas avec l\'éluant.'),
    () => choix('Repérer le front', 'Pourquoi trace-t-on le front de l\'éluant dès la sortie de la plaque ?',
      'En séchant, la plaque ne montre plus la limite atteinte par l\'éluant.',
      [['Pour que les taches arrêtent de monter.', 'Hors de la cuve, les taches ne montent plus ; on trace le front car sa limite disparaît en séchant.'],
       ['Pour révéler les espèces incolores.', 'Le trait du front ne révèle rien : les espèces incolores se voient sous la lampe UV.']],
      'L\'éluant s\'évapore vite : on trace tout de suite au crayon la limite qu\'il a atteinte, le front de l\'éluant.'),
    () => choix('Préparer les dépôts', 'Pour déposer une espèce solide sur la plaque, que fait-on d\'abord ?',
      'On la dissout dans un peu de solvant (par exemple l\'éthanol).',
      [['On la pose en petit tas sur le trait de dépôt.', 'Un solide posé tel quel ne monte pas avec l\'éluant : on le dissout d\'abord dans un peu de solvant.'],
       ['On la dissout dans l\'éluant de la cuve.', 'On ne met rien dans l\'éluant de la cuve : on dissout le solide dans un peu de solvant, puis on fait un petit dépôt.']],
      'On dissout le solide dans un peu de solvant, puis on fait un petit dépôt sur le trait.'),
  ];
  const SIGLE = () => choix('Vocabulaire', 'Que signifie CCM ?', 'Chromatographie sur couche mince',
    [['Chromatographie sur colonne mobile', 'La plaque est recouverte d\'une fine couche de silice : CCM veut dire chromatographie sur couche mince.'],
     ['Chimie des corps mélangés', 'CCM est le sigle de la technique : chromatographie sur couche mince.'],
     ['Chromatographie sur cuve métallique', 'La cuve est en verre ; le « couche mince » est la fine couche de silice de la plaque.']],
    'CCM : chromatographie sur couche mince (la fine couche de silice de la plaque).');

  /* ---------- Tirage de la série ---------- */
  function questionsSerie() {
    const noms = Object.keys(FAMILLES);
    const chromos = noms.concat(melanger(noms).slice(0, 2)).map(n => FAMILLES[n]());
    const princ = [hasard([UV, PRINCIPE])];
    princ.push(hasard([UV, PRINCIPE].filter(f => f !== princ[0]).concat(AUTRES)));
    return melanger(chromos.concat([questionLegende()], princ.map(f => f()), [SIGLE()]));
  }

  window.CC = Object.assign(window.CC || {}, { FAMILLES, questionsSerie });
})();
