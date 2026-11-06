/* ============================================================
   Application « Réaliser un montage électrique » (Physique · Seconde)
   Moteur ME : plan de l'application, schémas, pages des modules.

   Utilise : assets/sommaire.js (SOM), assets/montage.js (MONTAGE),
             assets/bulle.js (BULLE).

   ME.priseEnMain(zone)     module 1 : prise en main du simulateur (un circuit guidé)
   ME.simulateur(zone)      module 1 : simulateur, montage choisi dans une liste de schémas
   ME.lire(zone)            module 2 : repérer la boucle principale, les nœuds et les dérivations
   ME.multimetre(zone)      module 3 : brancher, régler un voltmètre et un ampèremètre, mesurer
   ME.oscilloscope(zone)    module 3 : brancher les voies et la masse d'un oscilloscope
   ME.SCHEMAS               fabriques de schémas
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Simulateur de montage', desc: 'Prise en main, puis montages au choix', sousModules: true,
      parties: [{ nom: 'Prise en main du simulateur', entrainement: 'module_1a_manip', noms: { entrainement: 'Prise en main du simulateur' } },
                { nom: 'Simulateur', simulation: 'module_1b_simulateur', noms: { simulation: 'Simulateur : montages au choix' } }] },
    { n: 2, titre: 'Repérer la boucle principale et les dérivations', desc: 'Sur un schéma : boucle principale, nœuds et dérivations',
      parties: [{ nom: 'Repérer sur un schéma', entrainement: 'module_2_manip', noms: { entrainement: 'Repérer sur un schéma' } }] },
    { n: 3, titre: 'Brancher un multimètre ou un oscilloscope', desc: 'Voltmètre et ampèremètre : branchement, calibre, mesure ; oscilloscope : voies et masse', sousModules: true,
      parties: [{ nom: 'Brancher un multimètre', entrainement: 'module_3_manip', noms: { entrainement: 'Brancher et régler un multimètre' } },
                { nom: 'Brancher un oscilloscope', entrainement: 'module_3b_oscilloscope', noms: { entrainement: 'Brancher un oscilloscope' } }] },
  ];
  SOM.init({ nom: 'Réaliser un montage électrique', id: 'montage-electrique', plan: PLAN });

  const ind = n => MONTAGE.indice(n);
  // liens vers les autres modules, ajoutés aux explications du poste de montage
  const LIENS = {
    reperer: { href: 'module_2_manip.html', texte: 'Revoir : repérer la boucle principale (module 2)' },
    multimetre: { href: 'module_3_manip.html', texte: 'Revoir : brancher un multimètre (module 3)' },
    oscilloscope: { href: 'module_3b_oscilloscope.html', texte: 'Revoir : brancher un oscilloscope (module 3)' },
  };

  /* ============================================================
     SCHÉMAS
     C(def, chemin, …) : un chemin est une suite d'extrémités et de coins :
       'G.a'      borne d'un dipôle ;  'n1'  nœud ;  'R1.a>b'  dipôle traversé (entrée a, sortie b) ;
       [x, y]     coin d'un fil. Un fil est créé entre deux extrémités successives.
     Oscilloscope : une voie est un dipôle 'voie' (Y1, Y2) placé au point de sa flèche, de borne 'a' ce point
     et de borne 'b' la masse (def.masse : un nœud du schéma) ; chemin : ['n1', 'Y1.a>b', 'nm'].
     ============================================================ */
  function C(def, ...chemins) {
    def = Object.assign({ noeuds: [], intensites: [], tensions: [], croisements: [] }, def);
    def.dipoles.forEach(d => { if (d.type === 'voie') d.masse = [def.masse.x, def.masse.y]; });
    const pos = e => {
      const n = def.noeuds.find(x => x.id === e);
      if (n) return [n.x, n.y];
      const [id, t] = e.split('.');
      return MONTAGE.borneSchema(def.dipoles.find(d => d.id === id), t).map(v => Math.round(v * 10) / 10);
    };
    const fils = [];
    chemins.filter(Boolean).forEach(seq => {
      let prec = null, coins = [];
      seq.filter(x => x != null && x !== false).forEach(e => {
        if (Array.isArray(e)) { coins.push(e); return; }
        const m = e.match(/^(\w+)\.([ab])>([ab])$/);
        const [entree, sortie] = m ? [m[1] + '.' + m[2], m[1] + '.' + m[3]] : [e, e];
        if (prec) fils.push({ a: prec, b: entree, coins });
        coins = []; prec = sortie;
      });
    });
    def.fils = fils.map((f, i) => ({ id: 'f' + (i + 1), a: f.a, b: f.b, pts: [pos(f.a)].concat(f.coins, [pos(f.b)]) }));
    return def;
  }
  const D = (id, type, x, y, rot, o) => Object.assign({ id, type, x, y, rot: rot || 0 }, o || {});
  // voie k de l'oscilloscope : flèche depuis le point (x, y) dans la direction dir
  const Y = (k, x, y, dir) => D('Y' + k, 'voie', x, y, 0, { voie: k, dir });
  const L1 = { nom: 'la lampe L₁', lab: 'L₁' }, L2 = { nom: 'la lampe L₂', lab: 'L₂' };

  const S = {
    // générateur et une lampe
    gl: () => C({ vb: [240, 176], tension: 6, dipoles: [D('G', 'generateur', 120, 32), D('L', 'lampe', 120, 146)],
      intensites: [{ nom: 'I', x: 40, y: 90, dir: 'bas' }] },
      ['G.a', [40, 32], [40, 146], 'L.a>b', [200, 146], [200, 32], 'G.b']),
    // générateur et lampe, voltmètre aux bornes de la lampe
    glV: () => C({ vb: [240, 214], tension: 6, dipoles: [D('G', 'generateur', 120, 32), D('L', 'lampe', 120, 140), D('V', 'voltmetre', 120, 190, 0, { com: 1, mesure: 'U_L' })],
      noeuds: [{ id: 'n1', x: 60, y: 140 }, { id: 'n2', x: 180, y: 140 }],
      tensions: [{ nom: 'U_L', x1: 140, y1: 122, x2: 100, y2: 122, cote: 'haut' }] },
      ['G.a', [30, 32], [30, 140], 'n1', 'L.a>b', 'n2', [210, 140], [210, 32], 'G.b'], ['n1', [60, 190], 'V.a>b', [180, 190], 'n2']),
    // générateur, ampèremètre et lampe en série
    gal: () => C({ vb: [240, 176], tension: 6, dipoles: [D('G', 'generateur', 120, 32), D('A', 'amperemetre', 40, 90, 90, { com: 1, mesure: 'I' }), D('L', 'lampe', 120, 146)],
      intensites: [{ nom: 'I', x: 40, y: 56, dir: 'bas' }] },
      ['G.a', [40, 32], 'A.a>b', [40, 146], 'L.a>b', [200, 146], [200, 32], 'G.b']),
    // générateur, interrupteur et deux lampes en série
    gkll: () => C({ vb: [300, 214], tension: 6, table: ['L2', 'K', 'L1'],
      dipoles: [D('G', 'generateur', 150, 30), D('K', 'interrupteur', 40, 110, 90), D('L1', 'lampe', 120, 190, 0, L1), D('L2', 'lampe', 200, 190, 0, L2)] },
      ['G.a', [40, 30], 'K.a>b', [40, 190], 'L1.a>b', 'L2.a>b', [260, 190], [260, 30], 'G.b']),
    // générateur, interrupteur, ampèremètre et lampe (lecture du schéma)
    gkal: () => C({ vb: [300, 214], tension: 6, dipoles: [D('G', 'generateur', 150, 30), D('A', 'amperemetre', 40, 110, 90, { com: 1, mesure: 'I' }),
      D('K', 'interrupteur', 110, 190), D('L', 'lampe', 220, 190)], intensites: [{ nom: 'I', x: 40, y: 68, dir: 'bas' }] },
      ['G.a', [40, 30], 'A.a>b', [40, 190], 'K.a>b', 'L.a>b', [270, 190], [270, 30], 'G.b']),
    // générateur, ampèremètre, interrupteur, lampe et moteur
    gaklm: () => C({ vb: [300, 216], tension: 6, table: ['M', 'L', 'K'],
      dipoles: [D('G', 'generateur', 150, 30), D('A', 'amperemetre', 40, 110, 90, { com: 1, mesure: 'I' }), D('K', 'interrupteur', 110, 190),
        D('L', 'lampe', 190, 190), D('M', 'moteur', 260, 110, 90)], intensites: [{ nom: 'I', x: 40, y: 66, dir: 'bas' }] },
      ['G.a', [40, 30], 'A.a>b', [40, 190], 'K.a>b', 'L.a>b', [260, 190], 'M.b>a', [260, 30], 'G.b']),
    // générateur, DEL et résistance de protection
    gdr: () => C({ vb: [300, 214], tension: 6, table: ['R', 'D'],
      dipoles: [D('G', 'generateur', 150, 30), D('D', 'del', 40, 110, 90), D('R', 'resistance', 150, 190, 0, { valeur: 390 })] },
      ['G.a', [40, 30], 'D.a>b', [40, 190], 'R.a>b', [260, 190], [260, 30], 'G.b']),
    // deux lampes en dérivation (A : ampèremètre dans la branche principale)
    ll: o => C({ vb: [300, 206], tension: 6, table: ['L2', 'L1'],
      dipoles: [D('G', 'generateur', 150, 28), D('L1', 'lampe', 150, 110, 0, L1), D('L2', 'lampe', 150, 180, 0, L2)]
        .concat(o && o.A ? [D('A', 'amperemetre', 40, 66, 90, { com: 1, mesure: 'I' })] : []),
      noeuds: [{ id: 'n1', x: 40, y: 110 }, { id: 'n2', x: 260, y: 110 }],
      intensites: o && o.A ? [{ nom: 'I', x: 40, y: 40, dir: 'bas' }] : [] },
      ['G.a', [40, 28], o && o.A && 'A.a>b', 'n1', 'L1.a>b', 'n2', [260, 28], 'G.b'], ['n1', [40, 180], 'L2.a>b', [260, 180], 'n2']),
    // une lampe et une résistance en dérivation, voltmètre aux bornes de la résistance (prise en main)
    lrv: () => C({ vb: [300, 250], tension: 6, table: ['R', 'L'],
      dipoles: [D('G', 'generateur', 150, 28), D('L', 'lampe', 150, 110), D('R', 'resistance', 150, 180, 0, { valeur: 100 }), D('V', 'voltmetre', 150, 226, 0, { com: 1 })],
      noeuds: [{ id: 'n1', x: 40, y: 110 }, { id: 'n2', x: 260, y: 110 }, { id: 'n3', x: 96, y: 180 }, { id: 'n4', x: 204, y: 180 }] },
      ['G.a', [40, 28], 'n1', 'L.a>b', 'n2', [260, 28], 'G.b'],
      ['n1', [40, 180], 'n3', 'R.a>b', 'n4', [260, 180], 'n2'],
      ['n3', [96, 226], 'V.a>b', [204, 226], 'n4']),
    // interrupteur dans la branche principale, deux dipôles en dérivation (lampes, ou lampe et moteur)
    kxy: o => C({ vb: [300, 214], tension: 6, table: o.table,
      dipoles: [D('G', 'generateur', 150, 28), D('K', 'interrupteur', 40, 70, 90), D(o.x[0], o.x[1], 150, 120, 0, o.x[2]), D(o.y[0], o.y[1], o.A ? 190 : 150, 190, 0, o.y[2])]
        .concat(o.A ? [D('A', 'amperemetre', 95, 190, 0, { com: 1, mesure: 'I_M' })] : []),
      noeuds: [{ id: 'n1', x: 40, y: 120 }, { id: 'n2', x: 260, y: 120 }],
      intensites: o.A ? [{ nom: 'I_M', x: 66, y: 190, dir: 'droite' }] : [] },
      ['G.a', [40, 28], 'K.a>b', 'n1', o.x[0] + '.a>b', 'n2', [260, 28], 'G.b'], ['n1', [40, 190], o.A && 'A.a>b', o.y[0] + '.a>b', [260, 190], 'n2']),
    // deux dérivations, deux fils qui se croisent sans se toucher (lecture du schéma)
    croise: () => C({ vb: [300, 226], dipoles: [D('G', 'generateur', 150, 26), D('L1', 'lampe', 150, 90, 0, L1), D('L2', 'lampe', 150, 150, 0, L2), D('M', 'moteur', 150, 205)],
      noeuds: [{ id: 'n1', x: 30, y: 90 }, { id: 'n3', x: 30, y: 150 }, { id: 'n2', x: 270, y: 90 }, { id: 'n5', x: 270, y: 120 }], croisements: [{ x: 230, y: 150 }] },
      ['G.a', [30, 26], 'n1', 'L1.a>b', 'n2', [270, 26], 'G.b'], ['n1', 'n3'], ['n3', 'L2.a>b', [270, 150], 'n5'], ['n2', 'n5'],
      ['n3', [30, 205], 'M.a>b', [230, 205], [230, 120], 'n5']),
    // trois branches (deux dérivations), ampèremètre dans la branche principale
    trois: () => C({ vb: [300, 236], tension: 6, table: ['M', 'L2', 'L1'],
      dipoles: [D('G', 'generateur', 150, 26), D('A', 'amperemetre', 30, 58, 90, { com: 1, mesure: 'I' }), D('L1', 'lampe', 150, 100, 0, L1), D('L2', 'lampe', 150, 160, 0, L2), D('M', 'moteur', 150, 216)],
      noeuds: [{ id: 'n1', x: 30, y: 100 }, { id: 'n3', x: 30, y: 160 }, { id: 'n2', x: 270, y: 100 }, { id: 'n4', x: 270, y: 160 }],
      intensites: [{ nom: 'I', x: 30, y: 36, dir: 'bas' }] },
      ['G.a', [30, 26], 'A.a>b', 'n1', 'L1.a>b', 'n2', [270, 26], 'G.b'], ['n1', 'n3'], ['n3', 'L2.a>b', 'n4'], ['n2', 'n4'], ['n3', [30, 216], 'M.a>b', [270, 216], 'n4']),
    // deux résistances en série (390 Ω puis 100 Ω), générateur de 8 V :
    // o.A : ampèremètres en I1, I2, I3 (1, 2, 3) ; o.V : voltmètres pour UG, U390, U100 ('G', '390', '100')
    serie(o) {
      const A = o.A || [], V = o.V || [], VG = V.includes('G'), V1 = V.includes('390'), V2 = V.includes('100');
      const d = [D('G', 'generateur', 170, 70), D('R1', 'resistance', 95, 150, 0, { valeur: 390 }), D('R2', 'resistance', 245, 150, 0, { valeur: 100 })];
      if (A.includes(1)) d.push(D('A1', 'amperemetre', 30, 100, 90, { com: 1, mesure: 'I_1' }));
      if (A.includes(2)) d.push(D('A2', 'amperemetre', 170, 150, 0, { com: 1, mesure: 'I_2' }));
      if (A.includes(3)) d.push(D('A3', 'amperemetre', 310, 100, 90, { com: -1, mesure: 'I_3' }));
      const noeuds = [], tensions = [];
      if (VG) {
        d.push(D('VG', 'voltmetre', 170, 16, 0, { com: 1, mesure: 'U_G' }));
        noeuds.push({ id: 'n1', x: 30, y: 70 }, { id: 'n2', x: 310, y: 70 });
        tensions.push({ nom: 'U_G', x1: 230, y1: 46, x2: 110, y2: 46, cote: 'haut' });
      }
      if (V1) {
        d.push(D('V1', 'voltmetre', 95, 196, 0, { com: 1, mesure: 'U_390' }));
        noeuds.push({ id: 'n3', x: 52, y: 150 }, { id: 'n4', x: 138, y: 150 });
        tensions.push({ nom: 'U_390', x1: 117, y1: 167, x2: 73, y2: 167, cote: 'bas' });
      }
      if (V2) {
        d.push(D('V2', 'voltmetre', 245, 196, 0, { com: 1, mesure: 'U_100' }));
        noeuds.push({ id: 'n5', x: 202, y: 150 }, { id: 'n6', x: 288, y: 150 });
        tensions.push({ nom: 'U_100', x1: 267, y1: 167, x2: 223, y2: 167, cote: 'bas' });
      }
      const ch = [['G.a', VG ? 'n1' : [30, 70], A.includes(1) && 'A1.a>b', [30, 150], V1 && 'n3', 'R1.a>b', V1 && 'n4', A.includes(2) && 'A2.a>b', V2 && 'n5', 'R2.a>b', V2 && 'n6',
        [310, 150], A.includes(3) && 'A3.b>a', VG ? 'n2' : [310, 70], 'G.b']];
      if (VG) ch.push(['n1', [30, 16], 'VG.a>b', [310, 16], 'n2']);
      if (V1) ch.push(['n3', [52, 196], 'V1.a>b', [138, 196], 'n4']);
      if (V2) ch.push(['n5', [202, 196], 'V2.a>b', [288, 196], 'n6']);
      const haut = VG ? 0 : 44, bas = V1 || V2 ? 216 : 174;
      const intensites = [{ nom: 'I_1', x: 30, y: 80, dir: 'bas' }, { nom: 'I_2', x: 150, y: 150, dir: 'droite' }, { nom: 'I_3', x: 310, y: 132, dir: 'haut', cote: 'droite' }]
        .filter((x, i) => A.includes(i + 1));
      return C({ vb: [0, haut, 340, bas - haut], tension: 8, dipoles: d, noeuds, table: ['R2', 'R1'], intensites, tensions }, ...ch);
    },
    // deux résistances en dérivation (390 Ω et 100 Ω), générateur de 8 V : o.A : ampèremètres I1 (branche
    // principale), I2 (390 Ω), I3 (100 Ω) ; o.U : flèches de tension UG, U390, U100
    derivation(o) {
      const A = (o && o.A) || [];
      const d = [D('G', 'generateur', 190, 40), D('R1', 'resistance', 180, 110, 0, { valeur: 390 }), D('R2', 'resistance', 180, 186, 0, { valeur: 100 })];
      if (A.includes(1)) d.push(D('A1', 'amperemetre', 60, 72, 90, { com: 1, mesure: 'I_1' }));
      if (A.includes(2)) d.push(D('A2', 'amperemetre', 106, 110, 0, { com: 1, mesure: 'I_2' }));
      if (A.includes(3)) d.push(D('A3', 'amperemetre', 60, 148, 90, { com: 1, mesure: 'I_3' }));
      const intensites = [{ nom: 'I_1', x: 60, y: 96, dir: 'bas' }, { nom: 'I_2', x: 136, y: 110, dir: 'droite' }, { nom: 'I_3', x: 60, y: 172, dir: 'bas' }]
        .filter((x, i) => A.includes(i + 1));
      return C({ vb: [300, 206], tension: 8, dipoles: d, noeuds: [{ id: 'n1', x: 60, y: 110 }, { id: 'n2', x: 270, y: 110 }], table: ['R2', 'R1'], intensites,
        tensions: o && o.U ? [{ nom: 'U_G', x1: 228, y1: 12, x2: 152, y2: 12, cote: 'haut' }, { nom: 'U_390', x1: 203, y1: 94, x2: 157, y2: 94, cote: 'haut' },
          { nom: 'U_100', x1: 203, y1: 170, x2: 157, y2: 170, cote: 'haut' }] : [] },
        ['G.a', [60, 40], A.includes(1) && 'A1.a>b', 'n1', A.includes(2) && 'A2.a>b', 'R1.a>b', 'n2', [270, 40], 'G.b'],
        ['n1', A.includes(3) && 'A3.a>b', [60, 186], 'R2.a>b', [270, 186], 'n2']);
    },
    // deux résistances en dérivation avec les voltmètres UG, U390, U100
    derivationV: () => C({ vb: [340, 262], tension: 8, table: ['R2', 'R1'],
      dipoles: [D('G', 'generateur', 180, 60), D('VG', 'voltmetre', 180, 10, 0, { com: 1, mesure: 'U_G' }), D('R1', 'resistance', 180, 120, 0, { valeur: 390 }),
        D('V1', 'voltmetre', 180, 152, 0, { com: 1, mesure: 'U_390' }), D('R2', 'resistance', 180, 210, 0, { valeur: 100 }), D('V2', 'voltmetre', 180, 242, 0, { com: 1, mesure: 'U_100' })],
      noeuds: [{ id: 'n0', x: 60, y: 60 }, { id: 'm0', x: 300, y: 60 }, { id: 'n1', x: 60, y: 120 }, { id: 'n2', x: 300, y: 120 },
        { id: 'n3', x: 110, y: 120 }, { id: 'n4', x: 250, y: 120 }, { id: 'n5', x: 110, y: 210 }, { id: 'n6', x: 250, y: 210 }],
      tensions: [{ nom: 'U_G', x1: 220, y1: 36, x2: 140, y2: 36, cote: 'haut' }, { nom: 'U_390', x1: 205, y1: 104, x2: 155, y2: 104, cote: 'haut' },
        { nom: 'U_100', x1: 205, y1: 194, x2: 155, y2: 194, cote: 'haut' }] },
      ['G.a', 'n0', 'n1', 'n3', 'R1.a>b', 'n4', 'n2', 'm0', 'G.b'], ['n0', [60, 10], 'VG.a>b', [300, 10], 'm0'],
      ['n1', [60, 210], 'n5', 'R2.a>b', 'n6', [300, 210], 'n2'], ['n3', [110, 152], 'V1.a>b', [250, 152], 'n4'], ['n5', [110, 242], 'V2.a>b', [250, 242], 'n6']),
    // résistance de 470 Ω : ampèremètre en série, voltmètre en dérivation sur la résistance
    ohm: t => C({ vb: [270, 190], tension: t || 8, dipoles: [D('G', 'generateur', 150, 32), D('A', 'amperemetre', 50, 72, 90, { com: 1, mesure: 'I' }),
      D('R', 'resistance', 140, 116, 0, { valeur: 470 }), D('V', 'voltmetre', 140, 170, 0, { com: 1, mesure: 'U' })],
      noeuds: [{ id: 'n1', x: 50, y: 116 }, { id: 'n2', x: 230, y: 116 }],
      intensites: [{ nom: 'I', x: 50, y: 48, dir: 'bas' }], tensions: [{ nom: 'U', x1: 163, y1: 100, x2: 117, y2: 100, cote: 'haut' }] },
      ['G.a', [50, 32], 'A.a>b', 'n1', 'R.a>b', 'n2', [230, 32], 'G.b'], ['n1', [50, 170], 'V.a>b', [230, 170], 'n2']),

    // ----- oscilloscope : masse à la borne − du générateur -----
    // générateur et lampe ; CH1 à la borne + du générateur
    oscL: () => C({ vb: [250, 196], tension: 6, masse: { x: 210, y: 150 },
      dipoles: [D('G', 'generateur', 125, 40), D('L', 'lampe', 125, 150), Y(1, 40, 95, 'gauche')],
      noeuds: [{ id: 'n1', x: 40, y: 95 }, { id: 'nm', x: 210, y: 150 }] },
      ['G.a', [40, 40], 'n1', [40, 150], 'L.a>b', 'nm', [210, 40], 'G.b'], ['n1', 'Y1.a>b', 'nm']),
    // deux résistances en série (390 Ω puis 100 Ω) ; o.deux : CH1 à la borne + du générateur et CH2 entre les
    // résistances ; sinon CH1 seule, entre les résistances
    oscRR: o => {
      const deux = o && o.deux, k = deux ? 2 : 1;
      return C({ vb: [320, 216], tension: 8, masse: { x: 280, y: 170 }, table: ['R2', 'R1'],
        dipoles: [D('G', 'generateur', 160, 40), D('R1', 'resistance', 105, 170, 0, { valeur: 390 }), D('R2', 'resistance', 215, 170, 0, { valeur: 100 }), Y(k, 160, 170, 'bas')]
          .concat(deux ? [Y(1, 40, 105, 'gauche')] : []),
        noeuds: [{ id: 'n2', x: 160, y: 170 }, { id: 'nm', x: 280, y: 170 }].concat(deux ? [{ id: 'n1', x: 40, y: 105 }] : []) },
        ['G.a', [40, 40], deux ? 'n1' : [40, 105], [40, 170], 'R1.a>b', 'n2', 'R2.a>b', 'nm', [280, 40], 'G.b'],
        ['n2', 'Y' + k + '.a>b', 'nm'], deux && ['n1', 'Y1.a>b', 'nm']);
    },
    // résistance de protection et DEL en série ; CH1 à la borne + du générateur, CH2 aux bornes de la DEL
    oscDR: () => C({ vb: [320, 216], tension: 6, masse: { x: 280, y: 170 }, table: ['D', 'R'],
      dipoles: [D('G', 'generateur', 160, 40), D('R', 'resistance', 105, 170, 0, { valeur: 390 }), D('D', 'del', 215, 170), Y(1, 40, 105, 'gauche'), Y(2, 160, 170, 'bas')],
      noeuds: [{ id: 'n1', x: 40, y: 105 }, { id: 'n2', x: 160, y: 170 }, { id: 'nm', x: 280, y: 170 }] },
      ['G.a', [40, 40], 'n1', [40, 170], 'R.a>b', 'n2', 'D.a>b', 'nm', [280, 40], 'G.b'], ['n1', 'Y1.a>b', 'nm'], ['n2', 'Y2.a>b', 'nm']),
    // lampe en dérivation avec une branche résistance + DEL ; CH1 à la borne + du générateur, CH2 aux bornes de la DEL
    oscDeriv: () => C({ vb: [300, 226], tension: 6, masse: { x: 260, y: 180 }, table: ['D', 'L', 'R'],
      dipoles: [D('G', 'generateur', 150, 36), D('L', 'lampe', 150, 110), D('R', 'resistance', 100, 180, 0, { valeur: 390 }), D('D', 'del', 210, 180),
        Y(1, 40, 72, 'gauche'), Y(2, 158, 180, 'bas')],
      noeuds: [{ id: 'nc', x: 40, y: 72 }, { id: 'n1', x: 40, y: 110 }, { id: 'n2', x: 260, y: 110 }, { id: 'n3', x: 158, y: 180 }, { id: 'nm', x: 260, y: 180 }] },
      ['G.a', [40, 36], 'nc', 'n1', 'L.a>b', 'n2', [260, 36], 'G.b'], ['n1', [40, 180], 'R.a>b', 'n3', 'D.a>b', 'nm', 'n2'],
      ['nc', 'Y1.a>b', 'nm'], ['n3', 'Y2.a>b', 'nm']),
  };

  const RAPPEL_A = '<b>L\'ampèremètre se branche en série</b> : on débranche un fil et il prend sa place, le courant doit le traverser. Bornes <b>10A et COM</b> (calibre 10 A), puis <b>mA</b> si l\'intensité est petite. L\'indication est positive quand le courant sort par COM.';
  const RAPPEL_V = '<b>Le voltmètre se branche en dérivation</b>, sur les bornes du dipôle, sans modifier le circuit : bornes <b>V et COM</b>. Il indique une tension positive si sa borne COM est reliée du côté de la borne − du générateur.';
  const RAPPEL_OSC = '<b>L\'oscilloscope se branche en dérivation</b>, comme un voltmètre, sans débrancher aucun fil. Chaque voie a sa fiche : borne <b>rouge</b> au point où arrive la flèche de la voie (CH1 ou CH2) sur le schéma, borne <b>noire</b> au point marqué du symbole de masse. Les deux bornes noires sont reliées dans l\'appareil : elles vont au même point du circuit.';
  const RAPPEL_CAL = '<b>Calibre</b> : on commence par le plus grand, puis on choisit le plus petit calibre qui reste plus grand que la valeur mesurée. « 1 » à gauche de l\'écran : la valeur dépasse le calibre.';

  // en-tête d'une page de manipulation : titre, rappel ⓘ, numéro
  const tete = (titre, num, rappel) => `<div class="me-sit-tete"><h3 class="me-sit-titre">${titre}${rappel ? BULLE.info(rappel, 'Rappel') : ''}</h3>${num ? `<span class="me-sit-num">${num}</span>` : ''}</div>`;
  const bravo = t => `<div class="callout-success er-retour"><p><b class="er-ok">Bravo !</b> ${t}</p></div>`;
  const defiler = el => setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);

  /* ============================================================
     MODULE 1 : PRISE EN MAIN DU SIMULATEUR (un seul circuit, guidé)
     ============================================================ */
  function priseEnMain(zone) {
    function afficher() {
      zone.innerHTML = `${tete('Une lampe et une résistance en dérivation, un voltmètre', '', RAPPEL_V)}
        <div class="me-poste"></div><div class="me-bilan" aria-live="polite"></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_1b_simulateur.html">Simulateur →</a></div>`;
      ME.posteEnCours = MONTAGE.monter(zone.querySelector('.me-poste'), S.lrv(), {
        boucle: true, com: true, liens: LIENS,
        textes: { boucleOk: 'Juste ! C\'est une boucle principale : elle part du générateur et y revient. Ici, deux boucles conviennent : celle de la lampe ou celle de la résistance ; jamais celle du voltmètre. Ta boucle reste surlignée pendant le montage.' },
        onFin() {
          zone.querySelector('.me-bilan').innerHTML = bravo('Le montage est conforme au schéma : la boucle principale d\'abord, du générateur au générateur, puis les dérivations, une par une. Passe au simulateur pour réaliser d\'autres montages.');
          SOM.marquer({ fait: true });
          defiler(zone.querySelector('.me-bilan'));
        },
      });
      zone.querySelector('[data-a="re"]').onclick = afficher;
    }
    afficher();
  }

  /* ============================================================
     MODULE 1 : SIMULATEUR (montage choisi dans une liste de schémas,
     du plus simple au plus compliqué)
     ============================================================ */
  const MONTAGES = [
    { titre: 'Une lampe', circuit: S.gl },
    { titre: 'Deux lampes et un interrupteur en série', circuit: S.gkll },
    { titre: 'Une DEL et sa résistance de protection', circuit: S.gdr },
    { titre: 'Lampe, moteur et interrupteur en série, avec un ampèremètre', circuit: S.gaklm },
    { titre: 'Deux lampes en dérivation', circuit: () => S.ll() },
    { titre: 'Lampe et moteur en dérivation, interrupteur dans la branche principale', circuit: () => S.kxy({ x: ['L', 'lampe'], y: ['M', 'moteur'], table: ['M', 'K', 'L'] }) },
    { titre: 'Deux lampes en dérivation et un ampèremètre', circuit: () => S.ll({ A: true }) },
    { titre: 'Une résistance, un ampèremètre et un voltmètre', circuit: () => S.ohm(8) },
    { titre: 'Deux résistances en série et trois voltmètres', circuit: () => S.serie({ V: ['G', '390', '100'] }) },
    { titre: 'Deux résistances en dérivation et trois ampèremètres', circuit: () => S.derivation({ A: [1, 2, 3] }) },
    { titre: 'Deux lampes et un moteur en dérivation, avec un ampèremètre', circuit: S.trois },
    { titre: 'Deux résistances en dérivation et trois voltmètres', circuit: S.derivationV },
    { titre: 'Une lampe et un oscilloscope', circuit: S.oscL },
    { titre: 'Deux résistances en série, oscilloscope à deux voies', circuit: () => S.oscRR({ deux: true }) },
    { titre: 'Une lampe en dérivation avec une DEL et sa résistance, oscilloscope à deux voies', circuit: S.oscDeriv },
  ];
  // schémas réussis, gardés dans le navigateur (clé « montage-electrique-simulateur »)
  const CLE_SIM = 'montage-electrique-simulateur';
  function lireFaits() {
    try { const o = JSON.parse(localStorage.getItem(CLE_SIM) || '{}'); return new Set(Array.isArray(o.faits) ? o.faits : []); } catch (e) { return new Set(); }
  }
  function noterFait(k) {
    const f = lireFaits(); f.add(k);
    try { localStorage.setItem(CLE_SIM, JSON.stringify({ faits: Array.from(f).sort((a, b) => a - b) })); } catch (e) { /* stockage indisponible */ }
    if (MONTAGES.every((m, i) => f.has(i + 1))) SOM.marquer({ fait: true });
  }

  function simulateur(zone) {
    // l'adresse #schema-3 ouvre le schéma 3 ; sans ancre : la liste (le retour arrière du navigateur reste correct)
    function ouvrir() {
      const m = location.hash.match(/^#schema-(\d+)$/), k = m ? +m[1] : 0;
      if (k >= 1 && k <= MONTAGES.length) poste(k); else liste();
    }
    function liste() {
      const faits = lireFaits();
      zone.innerHTML = `${tete('Choisis un schéma', `${faits.size} / ${MONTAGES.length} réussi${faits.size > 1 ? 's' : ''}`)}
        <div class="me-liste">${MONTAGES.map((s, i) => `<a class="me-carte${faits.has(i + 1) ? ' ok' : ''}" href="#schema-${i + 1}">
          <span class="me-carte-num">${faits.has(i + 1) ? '✓' : i + 1}</span><span class="me-carte-fig" aria-hidden="true"></span>
          <span class="me-carte-titre">${s.titre}</span></a>`).join('')}</div>`;
      zone.querySelectorAll('.me-carte-fig').forEach((el, i) => MONTAGE.schema(el, MONTAGES[i].circuit(), {}));
    }
    function poste(k) {
      const s = MONTAGES[k - 1], der = k === MONTAGES.length, c = s.circuit();
      const rappel = c.dipoles.some(d => d.type === 'voie') ? RAPPEL_OSC : RAPPEL_A + '<br><br>' + RAPPEL_V;
      zone.innerHTML = `<p class="me-retour-liste"><a class="btn-small" href="#">← Liste des schémas</a></p>
        ${tete(s.titre, `Schéma ${k} / ${MONTAGES.length}`, rappel)}
        <div class="me-poste"></div><div class="me-bilan" aria-live="polite"></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="${der ? '#' : '#schema-' + (k + 1)}">${der ? 'Liste des schémas' : 'Schéma suivant →'}</a></div>`;
      ME.posteEnCours = MONTAGE.monter(zone.querySelector('.me-poste'), c, {
        boucle: false, com: true, liens: LIENS,
        onFin() {
          noterFait(k);
          zone.querySelector('.me-bilan').innerHTML = bravo('Le montage est conforme au schéma et il fonctionne.');
          defiler(zone.querySelector('.me-bilan'));
        },
      });
      zone.querySelector('[data-a="re"]').onclick = () => poste(k);
    }
    window.addEventListener('hashchange', () => { ouvrir(); window.scrollTo(0, 0); });
    ouvrir();
  }

  /* ============================================================
     MODULE 2 : REPÉRER LA BOUCLE PRINCIPALE ET LES DÉRIVATIONS (sur un schéma)
     ============================================================ */
  const LECTURES = [
    { titre: 'Circuit en série : générateur et lampe', circuit: S.gl },
    { titre: 'Circuit en série avec interrupteur et ampèremètre', circuit: S.gkal },
    { titre: 'Une dérivation', circuit: () => S.kxy({ x: ['L1', 'lampe', L1], y: ['L2', 'lampe', L2] }) },
    { titre: 'Deux dérivations', circuit: S.croise },
    { titre: 'Deux résistances en série, ampèremètres et voltmètres', circuit: () => S.serie({ A: [1, 2, 3], V: ['G', '390', '100'] }) },
    { titre: 'Deux résistances en dérivation et trois ampèremètres', circuit: () => S.derivation({ A: [1, 2, 3], U: true }) },
  ];
  // branche hors de la boucle qui contient l'élément touché : on suit fils et dipôles sans franchir un nœud
  function branche(c, id, boucle) {
    const B = new Set(boucle), noeud = e => c.noeuds.some(n => n.id === e), res = new Set(), file = [id];
    while (file.length) {
      const x = file.pop();
      if (res.has(x) || B.has(x)) continue;
      res.add(x);
      const f = c.fils.find(w => w.id === x);
      (f ? [f.a, f.b] : [x + '.a', x + '.b']).forEach(e => {
        if (noeud(e)) return;
        c.fils.forEach(w => { if (w.a === e || w.b === e) file.push(w.id); });
        const [di, t] = e.split('.');
        if (t && c.dipoles.some(q => q.id === di)) file.push(di);
      });
    }
    return Array.from(res);
  }

  function lire(zone) {
    let k = 0;
    const faits = new Set();
    function afficher() {
      const L = LECTURES[k], c = L.circuit();
      const st = { etape: 'boucle', choisis: [], boucle: [], touches: [], derivs: [], diag: null, ok: null, cerne: null };
      zone.innerHTML = `<div class="me-sit-tete"><h3 class="me-sit-titre">${L.titre}</h3><span class="me-sit-num">Schéma ${k + 1} / ${LECTURES.length}</span></div>
        <div class="me-lire"><div class="me-lire-schema"></div><div class="mt-consigne me-lire-cons" aria-live="polite"></div></div>
        <ol class="mt-deroule"></ol><div class="me-bilan"></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < LECTURES.length - 1 ? 'Schéma suivant →' : 'Module 3 : brancher un multimètre →'}</button></div>`;
      const zs = zone.querySelector('.me-lire-schema');
      zs.style.setProperty('--ratio', (c.vb[c.vb.length - 2] / c.vb[c.vb.length - 1]).toFixed(3));
      const vs = MONTAGE.schema(zs, c, { libre: true, onTouche: toucher });
      const horsBoucle = () => c.dipoles.filter(d => !st.boucle.includes(d.id)).map(d => d.id);
      function toucher(t) {
        st.diag = null; st.ok = null; st.cerne = null;
        if (st.etape === 'boucle') {
          if (t.type !== 'fil' && t.type !== 'dipole') return;
          const i = st.choisis.indexOf(t.id);
          if (i >= 0) st.choisis.splice(i, 1); else st.choisis.push(t.id);
        } else if (st.etape === 'noeuds') {
          if (t.type === 'noeud') { if (!st.touches.includes(t.id)) st.touches.push(t.id); if (st.touches.length === c.noeuds.length) suite(); }
          else if (t.type === 'croisement') st.diag = 'Ici les deux fils se croisent sans se toucher : il n\'y a pas de point noir, ce n\'est pas un nœud.';
          else st.diag = 'Touche les nœuds : les points noirs où le courant se partage.';
        } else if (st.etape === 'derivs') {
          if (t.type === 'noeud' || t.type === 'croisement') { st.diag = 'Touche un fil ou un dipôle de la dérivation.'; maj(); return; }
          if (st.boucle.includes(t.id)) { st.diag = 'Cet élément fait partie de la boucle principale : une dérivation est une branche hors de cette boucle.'; maj(); return; }
          branche(c, t.id, st.boucle).forEach(x => { if (!st.derivs.includes(x)) st.derivs.push(x); });
          if (horsBoucle().every(id => st.derivs.includes(id))) suite();
        }
        maj();
      }
      function suite() {
        if (st.etape === 'boucle') st.etape = 'noeuds';
        else if (st.etape === 'noeuds') st.etape = horsBoucle().length ? 'derivs' : 'fin';
        else st.etape = 'fin';
        if (st.etape === 'derivs' && !c.noeuds.length) st.etape = 'fin';
        if (st.etape === 'fin') fin();
      }
      function fin() {
        faits.add(k);
        const nd = new Set(horsBoucle().map(id => branche(c, id, st.boucle).sort().join())).size;
        zone.querySelector('.me-bilan').innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Bravo !</b> ${c.noeuds.length
          ? `La boucle principale part du générateur et y revient ; le schéma a ${c.noeuds.length} nœuds et ${nd} dérivation${nd > 1 ? 's' : ''}. Au montage, on fera d'abord la boucle, puis les dérivations une par une.`
          : 'Pas de nœud : tout le circuit est la boucle principale, c\'est un circuit en série.'}</p></div>`;
        zone.querySelector('[data-a="suite"]').disabled = false;
        if (faits.size === LECTURES.length) SOM.marquer({ fait: true });
      }
      function maj() {
        vs.maj({ libre: st.etape !== 'fin', choisis: st.etape === 'boucle' ? st.choisis : [], boucle: st.boucle, touches: st.touches, derivs: st.derivs, cerne: st.cerne });
        const cons = zone.querySelector('.me-lire-cons');
        let h = '';
        if (st.etape === 'boucle') h = '<p>1. Surligne la <b>boucle principale</b>, celle qui contient le générateur : touche ses fils et ses dipôles (toucher à nouveau enlève), puis « Vérifier ».</p><div class="mt-cons-actions"><button type="button" class="btn-small" data-a="verifier">Vérifier</button></div>';
        else if (st.etape === 'noeuds') h = `<p>2. Touche les <b>nœuds</b> : les points où le courant se partage (${st.touches.length} touché${st.touches.length > 1 ? 's' : ''}).</p><div class="mt-cons-actions"><button type="button" class="btn-small" data-a="aucun">Il n'y a aucun nœud</button></div>`;
        else if (st.etape === 'derivs') h = '<p>3. Touche les <b>dérivations</b> : les branches hors de la boucle principale.</p>';
        else h = '<p class="mt-ok"><b>Juste !</b> Le schéma est lu.</p>';
        if (st.ok) h += `<div class="callout-success mt-diag">${st.ok}</div>`;
        if (st.diag) h += `<div class="callout-danger mt-diag"><b>Ce n'est pas ça.</b> ${st.diag}</div>`;
        cons.innerHTML = h;
        const bv = cons.querySelector('[data-a="verifier"]');
        if (bv) bv.onclick = () => {
          const r = MONTAGE.verifierBoucle(c, st.choisis);
          if (!r.ok) { st.diag = r.diag; st.cerne = r.cerne || null; maj(); return; }
          st.boucle = r.choisis; st.ok = 'Juste ! C\'est la boucle principale : elle part du générateur et y revient.';
          suite(); maj();
        };
        const ba = cons.querySelector('[data-a="aucun"]');
        if (ba) ba.onclick = () => {
          st.diag = null; st.ok = null;
          if (c.noeuds.length) st.diag = 'Regarde bien : le schéma a des points noirs, où le courant se partage.';
          else { st.ok = 'Juste : aucun point noir, le courant ne se partage nulle part.'; suite(); }
          maj();
        };
        const ol = zone.querySelector('.mt-deroule'), ordre = ['boucle', 'noeuds', 'derivs', 'fin'], i = ordre.indexOf(st.etape);
        ol.innerHTML = ['Surligne la boucle principale.', 'Touche les nœuds (ou « Il n\'y a aucun nœud »).', 'Touche les dérivations.']
          .map((t, j) => `<li class="${j < i ? 'fait' : j === i ? 'ici' : 'avenir'}">${t}</li>`).join('');
      }
      zone.querySelector('[data-a="re"]').onclick = afficher;
      zone.querySelector('[data-a="suite"]').onclick = () => {
        if (k < LECTURES.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = 'module_3_manip.html';
      };
      maj();
    }
    afficher();
  }

  /* ============================================================
     MODULE 3 : BRANCHER UN MULTIMÈTRE
     Le circuit est monté et allumé : on ajoute l'appareil (l'ampèremètre à la
     place d'un fil débranché), on le règle (fonction, calibre), on lit la mesure.
     ============================================================ */
  const MESURES = [
    { titre: 'Tension aux bornes d\'une lampe', circuit: S.glV, mesurer: ['V'], rappel: RAPPEL_V,
      bilan: 'Le voltmètre est en dérivation : le circuit n\'a pas été modifié, la lampe a brillé tout le temps.' },
    { titre: 'Intensité du courant dans une lampe', circuit: S.gal, mesurer: ['A'], rappel: RAPPEL_A,
      bilan: 'Fil débranché, la lampe s\'est éteinte : l\'ampèremètre referme le circuit, le courant le traverse.' },
    { titre: 'Tension aux bornes d\'une résistance', circuit: () => S.serie({ V: ['100'] }), mesurer: ['V2'], rappel: RAPPEL_V,
      bilan: 'Le calibre 2 V est le plus petit qui reste plus grand que la tension : il donne la lecture la plus précise.' },
    { titre: 'Intensité dans une branche en dérivation', circuit: () => S.derivation({ A: [2] }), mesurer: ['A2'], rappel: RAPPEL_A,
      bilan: 'L\'ampèremètre est dans la branche de la résistance de 390 Ω : il mesure le courant de cette branche seulement.' },
    { titre: 'Intensité et tension pour une résistance', circuit: () => S.ohm(8), mesurer: ['A', 'V'], rappel: RAPPEL_A + '<br><br>' + RAPPEL_V,
      bilan: 'L\'ampèremètre est en série, le voltmètre en dérivation : on mesure l\'intensité du courant qui traverse la résistance et la tension à ses bornes.' },
  ];

  function multimetre(zone) {
    let k = 0;
    const faits = new Set();
    function afficher() {
      const s = MESURES[k];
      zone.innerHTML = `${tete(s.titre, `Situation ${k + 1} / ${MESURES.length}`, s.rappel + '<br><br>' + RAPPEL_CAL)}
        <div class="me-poste"></div><div class="me-bilan" aria-live="polite"></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < MESURES.length - 1 ? 'Situation suivante →' : 'Brancher un oscilloscope →'}</button></div>`;
      const c = s.circuit();
      ME.posteEnCours = MONTAGE.monter(zone.querySelector('.me-poste'), c, {
        mode: 'mesurer', mesurer: s.mesurer, com: true,
        onFin(b) {
          const l = Object.keys(b.mesures).map(id => `${ind(c.dipoles.find(d => d.id === id).mesure)} = ${b.mesures[id]}`).join(' ; ');
          zone.querySelector('.me-bilan').innerHTML = bravo(`${l}. ${s.bilan}`);
          zone.querySelector('[data-a="suite"]').disabled = false;
          faits.add(k);
          if (faits.size === MESURES.length) SOM.marquer({ fait: true });
          defiler(zone.querySelector('.me-bilan'));
        },
      });
      zone.querySelector('[data-a="re"]').onclick = afficher;
      zone.querySelector('[data-a="suite"]').onclick = () => {
        if (k < MESURES.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = 'module_3b_oscilloscope.html';
      };
    }
    afficher();
  }

  /* ============================================================
     MODULE 3 : BRANCHER UN OSCILLOSCOPE
     Le circuit est monté et allumé : on branche chaque voie (borne rouge au point
     de sa flèche, borne noire à la masse) ; l'écran affiche les tensions.
     ============================================================ */
  const OSCILLOS = [
    { titre: 'Tension aux bornes du générateur', circuit: S.oscL, mesurer: ['Y1'],
      bilan: 'La voie CH1 affiche la tension entre la borne + du générateur et la masse, reliée à sa borne − : c\'est la tension aux bornes du générateur.' },
    { titre: 'Tension aux bornes d\'une résistance', circuit: () => S.oscRR(), mesurer: ['Y1'],
      bilan: 'La masse est reliée à la borne − du générateur : la voie CH1 affiche la tension aux bornes de la résistance de 100 Ω.' },
    { titre: 'Deux tensions à la fois', circuit: () => S.oscRR({ deux: true }), mesurer: ['Y1', 'Y2'],
      bilan: 'Les deux bornes noires sont au même point, la masse : CH1 affiche la tension aux bornes du générateur, CH2 la tension aux bornes de la résistance de 100 Ω.' },
    { titre: 'Une DEL et sa résistance de protection', circuit: S.oscDR, mesurer: ['Y1', 'Y2'],
      bilan: 'Les deux bornes noires sont au même point, la masse : CH1 affiche la tension aux bornes du générateur, CH2 la tension aux bornes de la DEL.' },
  ];

  function oscilloscope(zone) {
    let k = 0;
    const faits = new Set();
    function afficher() {
      const s = OSCILLOS[k];
      zone.innerHTML = `${tete(s.titre, `Situation ${k + 1} / ${OSCILLOS.length}`, RAPPEL_OSC)}
        <div class="me-poste"></div><div class="me-bilan" aria-live="polite"></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < OSCILLOS.length - 1 ? 'Situation suivante →' : 'Accueil de l\'application'}</button></div>`;
      ME.posteEnCours = MONTAGE.monter(zone.querySelector('.me-poste'), s.circuit(), {
        mode: 'mesurer', mesurer: s.mesurer,
        onFin() {
          zone.querySelector('.me-bilan').innerHTML = bravo(s.bilan);
          zone.querySelector('[data-a="suite"]').disabled = false;
          faits.add(k);
          if (faits.size === OSCILLOS.length) SOM.marquer({ fait: true });
          defiler(zone.querySelector('.me-bilan'));
        },
      });
      zone.querySelector('[data-a="re"]').onclick = afficher;
      zone.querySelector('[data-a="suite"]').onclick = () => {
        if (k < OSCILLOS.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = '../index.html';
      };
    }
    afficher();
  }

  window.ME = { PLAN, SCHEMAS: S, priseEnMain, simulateur, lire, multimetre, oscilloscope, LECTURES, MONTAGES, MESURES, OSCILLOS };
})();
