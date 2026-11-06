/* ============================================================
   Application « Réaliser un montage électrique » (Physique · Seconde)
   Moteur ME : plan de l'application, schémas (TP du professeur et
   situations), pages de manipulation et série notée.

   Utilise : assets/sommaire.js (SOM), assets/montage.js (MONTAGE),
             assets/etapes.js (ETAPES), assets/bulle.js (BULLE).

   ME.lire(zone)                 module 1 : boucle principale, nœuds et dérivations sur 6 schémas
   ME.manip(zone, n)             modules 2 et 3 : situations successives (montage guidé)
   ME.serie(zone)                module 4 : 10 montages du TP, notés sur 20
   ME.SCHEMAS                    fabriques de schémas (tpSerie, tpDerivation, ohm…)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Lire le schéma', desc: 'Boucle principale, nœuds et dérivations',
      parties: [{ nom: 'Lire le schéma', entrainement: 'module_1_manip', noms: { entrainement: 'Manipulation : lire le schéma' } }] },
    { n: 2, titre: 'Montage en série', desc: 'De la borne du générateur à l\'autre borne, ampèremètre',
      parties: [{ nom: 'Montage en série', entrainement: 'module_2_manip', noms: { entrainement: 'Manipulation : montage en série' } }] },
    { n: 3, titre: 'Ajouter des dérivations', desc: 'Une dérivation à la fois, voltmètre',
      parties: [{ nom: 'Dérivations', entrainement: 'module_3_manip', noms: { entrainement: 'Manipulation : dérivations' } }] },
    { n: 4, titre: 'Montages du TP', desc: 'Série notée sur 20',
      parties: [{ nom: 'Montages du TP', questions: 'module_4_questions', noms: { questions: 'Entraînement' } }] },
  ];
  SOM.init({ nom: 'Réaliser un montage électrique', id: 'montage-electrique', plan: PLAN });

  const fr = (v, d) => (d == null ? String(+v.toPrecision(4)) : v.toFixed(d)).replace('.', ',').replace('-', '−');
  const ind = n => MONTAGE.indice(n);
  const hasard = l => l[Math.floor(Math.random() * l.length)];
  const melanger = l => l.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

  /* ============================================================
     SCHÉMAS
     C(def, chemin, …) : un chemin est une suite d'extrémités et de coins :
       'G.a'      borne d'un dipôle ;  'n1'  nœud ;  'R1.a>b'  dipôle traversé (entrée a, sortie b) ;
       [x, y]     coin d'un fil. Un fil est créé entre deux extrémités successives.
     ============================================================ */
  function C(def, ...chemins) {
    def = Object.assign({ noeuds: [], intensites: [], tensions: [], croisements: [] }, def);
    const pos = e => {
      const n = def.noeuds.find(x => x.id === e);
      if (n) return [n.x, n.y];
      const [id, t] = e.split('.');
      return MONTAGE.borneSchema(def.dipoles.find(d => d.id === id), t).map(v => Math.round(v * 10) / 10);
    };
    const fils = [];
    chemins.forEach(seq => {
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
  const L1 = { nom: 'la lampe L₁', lab: 'L₁' }, L2 = { nom: 'la lampe L₂', lab: 'L₂' };

  const S = {
    // générateur et une lampe
    gl: () => C({ vb: [240, 176], tension: 6, dipoles: [D('G', 'generateur', 120, 32), D('L', 'lampe', 120, 146)],
      intensites: [{ nom: 'I', x: 40, y: 90, dir: 'bas' }] },
      ['G.a', [40, 32], [40, 146], 'L.a>b', [200, 146], [200, 32], 'G.b']),
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
    // TP : circuit en série (ampèremètres en I1, I2, I3 ; voltmètres UG, U390, U100)
    tpSerie(o) {
      const A = o.A || [], V = !!o.V;
      const d = [D('G', 'generateur', 170, 70), D('R1', 'resistance', 95, 150, 0, { valeur: 390 }), D('R2', 'resistance', 245, 150, 0, { valeur: 100 })];
      if (A.includes(1)) d.push(D('A1', 'amperemetre', 30, 100, 90, { com: 1, mesure: 'I_1' }));
      if (A.includes(2)) d.push(D('A2', 'amperemetre', 170, 150, 0, { com: 1, mesure: 'I_2' }));
      if (A.includes(3)) d.push(D('A3', 'amperemetre', 310, 100, 90, { com: -1, mesure: 'I_3' }));
      const noeuds = [];
      if (V) {
        d.push(D('VG', 'voltmetre', 170, 16, 0, { com: 1, mesure: 'U_G' }), D('V1', 'voltmetre', 95, 196, 0, { com: 1, mesure: 'U_390' }), D('V2', 'voltmetre', 245, 196, 0, { com: 1, mesure: 'U_100' }));
        noeuds.push({ id: 'n1', x: 30, y: 70 }, { id: 'n2', x: 310, y: 70 }, { id: 'n3', x: 52, y: 150 }, { id: 'n4', x: 138, y: 150 }, { id: 'n5', x: 202, y: 150 }, { id: 'n6', x: 288, y: 150 });
      }
      const ch = [['G.a', V ? 'n1' : [30, 70], A.includes(1) && 'A1.a>b', [30, 150], V && 'n3', 'R1.a>b', V && 'n4', A.includes(2) && 'A2.a>b', V && 'n5', 'R2.a>b', V && 'n6',
        [310, 150], A.includes(3) && 'A3.b>a', V ? 'n2' : [310, 70], 'G.b']];
      if (V) ch.push(['n1', [30, 16], 'VG.a>b', [310, 16], 'n2'], ['n3', [52, 196], 'V1.a>b', [138, 196], 'n4'], ['n5', [202, 196], 'V2.a>b', [288, 196], 'n6']);
      return C({ vb: V ? [340, 216] : [0, 44, 340, 130], tension: 8, dipoles: d, noeuds, table: ['R2', 'R1'],
        intensites: [{ nom: 'I_1', x: 30, y: 80, dir: 'bas' }, { nom: 'I_2', x: 150, y: 150, dir: 'droite' }, { nom: 'I_3', x: 310, y: 132, dir: 'haut', cote: 'droite' }],
        tensions: V ? [{ nom: 'U_G', x1: 230, y1: 46, x2: 110, y2: 46, cote: 'haut' }, { nom: 'U_390', x1: 117, y1: 167, x2: 73, y2: 167, cote: 'bas' },
          { nom: 'U_100', x1: 267, y1: 167, x2: 223, y2: 167, cote: 'bas' }] : [] }, ...ch);
    },
    // TP : circuit en dérivation avec les ampèremètres I1 (branche principale), I2 (390 Ω), I3 (100 Ω)
    tpDerivation(o) {
      const A = !!(o && o.A);
      const d = [D('G', 'generateur', 190, 40), D('R1', 'resistance', 180, 110, 0, { valeur: 390 }), D('R2', 'resistance', 180, 186, 0, { valeur: 100 })];
      if (A) d.push(D('A1', 'amperemetre', 60, 72, 90, { com: 1, mesure: 'I_1' }), D('A2', 'amperemetre', 106, 110, 0, { com: 1, mesure: 'I_2' }), D('A3', 'amperemetre', 60, 148, 90, { com: 1, mesure: 'I_3' }));
      return C({ vb: [300, 206], tension: 8, dipoles: d, noeuds: [{ id: 'n1', x: 60, y: 110 }, { id: 'n2', x: 270, y: 110 }], table: ['R2', 'R1'],
        intensites: [{ nom: 'I_1', x: 60, y: 96, dir: 'bas' }, { nom: 'I_2', x: 136, y: 110, dir: 'droite' }, { nom: 'I_3', x: 60, y: 172, dir: 'bas' }],
        tensions: [{ nom: 'U_G', x1: 228, y1: 12, x2: 152, y2: 12, cote: 'haut' }, { nom: 'U_390', x1: 203, y1: 94, x2: 157, y2: 94, cote: 'haut' },
          { nom: 'U_100', x1: 203, y1: 170, x2: 157, y2: 170, cote: 'haut' }] },
        ['G.a', [60, 40], A && 'A1.a>b', 'n1', A && 'A2.a>b', 'R1.a>b', 'n2', [270, 40], 'G.b'], ['n1', A && 'A3.a>b', [60, 186], 'R2.a>b', [270, 186], 'n2']);
    },
    // TP : circuit en dérivation avec les voltmètres UG, U390, U100
    tpDerivationV: () => C({ vb: [340, 262], tension: 8, table: ['R2', 'R1'],
      dipoles: [D('G', 'generateur', 180, 60), D('VG', 'voltmetre', 180, 10, 0, { com: 1, mesure: 'U_G' }), D('R1', 'resistance', 180, 120, 0, { valeur: 390 }),
        D('V1', 'voltmetre', 180, 152, 0, { com: 1, mesure: 'U_390' }), D('R2', 'resistance', 180, 210, 0, { valeur: 100 }), D('V2', 'voltmetre', 180, 242, 0, { com: 1, mesure: 'U_100' })],
      noeuds: [{ id: 'n0', x: 60, y: 60 }, { id: 'm0', x: 300, y: 60 }, { id: 'n1', x: 60, y: 120 }, { id: 'n2', x: 300, y: 120 },
        { id: 'n3', x: 110, y: 120 }, { id: 'n4', x: 250, y: 120 }, { id: 'n5', x: 110, y: 210 }, { id: 'n6', x: 250, y: 210 }],
      tensions: [{ nom: 'U_G', x1: 220, y1: 36, x2: 140, y2: 36, cote: 'haut' }, { nom: 'U_390', x1: 205, y1: 104, x2: 155, y2: 104, cote: 'haut' },
        { nom: 'U_100', x1: 205, y1: 194, x2: 155, y2: 194, cote: 'haut' }] },
      ['G.a', 'n0', 'n1', 'n3', 'R1.a>b', 'n4', 'n2', 'm0', 'G.b'], ['n0', [60, 10], 'VG.a>b', [300, 10], 'm0'],
      ['n1', [60, 210], 'n5', 'R2.a>b', 'n6', [300, 210], 'n2'], ['n3', [110, 152], 'V1.a>b', [250, 152], 'n4'], ['n5', [110, 242], 'V2.a>b', [250, 242], 'n6']),
    // TP : loi d'Ohm (ampèremètre en série, voltmètre en dérivation sur la résistance de 470 Ω)
    ohm: t => C({ vb: [270, 190], tension: t || 8, dipoles: [D('G', 'generateur', 150, 32), D('A', 'amperemetre', 50, 72, 90, { com: 1, mesure: 'I' }),
      D('R', 'resistance', 140, 116, 0, { valeur: 470 }), D('V', 'voltmetre', 140, 170, 0, { com: 1, mesure: 'U' })],
      noeuds: [{ id: 'n1', x: 50, y: 116 }, { id: 'n2', x: 230, y: 116 }],
      intensites: [{ nom: 'I', x: 50, y: 48, dir: 'bas' }], tensions: [{ nom: 'U', x1: 163, y1: 100, x2: 117, y2: 100, cote: 'haut' }] },
      ['G.a', [50, 32], 'A.a>b', 'n1', 'R.a>b', 'n2', [230, 32], 'G.b'], ['n1', [50, 170], 'V.a>b', [230, 170], 'n2']),
  };

  const RAPPEL_A = '<b>L\'ampèremètre se branche en série</b> : le courant doit le traverser. On commence par les entrées <b>COM et 10A</b> (calibre 10 A), puis on passe à <b>mA</b> si l\'intensité est petite. L\'indication est positive quand le courant sort par COM.';
  const RAPPEL_V = '<b>Le voltmètre se branche en dérivation</b>, sur les bornes du dipôle, sans modifier le circuit : bornes <b>V et COM</b>. Il indique une tension positive si sa borne COM est reliée du côté de la borne − du générateur.';

  /* ============================================================
     MODULE 1 : LIRE LE SCHÉMA
     ============================================================ */
  const LECTURES = [
    { titre: 'Circuit en série : générateur et lampe', circuit: S.gl },
    { titre: 'Circuit en série avec interrupteur et ampèremètre', circuit: S.gkal },
    { titre: 'Une dérivation', circuit: () => S.kxy({ x: ['L1', 'lampe', L1], y: ['L2', 'lampe', L2] }) },
    { titre: 'Deux dérivations', circuit: S.croise },
    { titre: 'TP : circuit en série', circuit: () => S.tpSerie({ A: [1, 2, 3], V: true }) },
    { titre: 'TP : circuit en dérivation', circuit: () => S.tpDerivation({ A: true }) },
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
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < LECTURES.length - 1 ? 'Schéma suivant →' : 'Module 2 : montage en série →'}</button></div>`;
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
        if (k < LECTURES.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = 'module_2_manip.html';
      };
      maj();
    }
    afficher();
  }

  /* ============================================================
     MODULES 2 ET 3 : SITUATIONS DE MONTAGE
     ============================================================ */
  const tableauI = r => ['I_1', 'I_2', 'I_3'].filter(n => r[n]).map(n => `${ind(n)} = ${r[n].texte}`).join(' ; ');
  const SITUATIONS = {
    2: [
      { titre: 'Générateur et une lampe', circuit: S.gl, mesures: null,
        bilan: () => 'La lampe brille : le courant circule dans toute la boucle, du générateur au générateur.' },
      { titre: 'Générateur, interrupteur et deux lampes', circuit: S.gkll, mesures: null,
        bilan: () => 'Les deux lampes sont en série : elles brillent seulement quand la boucle est fermée et l\'interrupteur fermé.' },
      { titre: 'Générateur, ampèremètre, interrupteur, lampe et moteur', circuit: S.gaklm, mesures: 'dixA', com: true, rappel: RAPPEL_A,
        bilan: (b) => `L'ampèremètre est en série : I = ${b.mesures.I ? b.mesures.I.texte : ''}. Au calibre 10 A la lecture était peu précise ; en mA elle l'est beaucoup plus.` },
      { titre: 'Générateur, DEL et résistance de protection', circuit: S.gdr, mesures: null,
        bilan: () => 'La DEL brille : sa borne + est du côté de la borne + du générateur. Elle ne laisse passer le courant que dans ce sens.' },
      { titre: 'Montage série du TP : ampèremètre en I₁', num: 5, circuit: () => S.tpSerie({ A: [1] }), rappel: RAPPEL_A,
        bilan: (b, r) => `${tableauI(r)}. Déplace maintenant l'ampèremètre en I₂ (situation suivante).` },
      { titre: 'Montage série du TP : ampèremètre en I₂', num: 5, circuit: () => S.tpSerie({ A: [2] }), rappel: RAPPEL_A,
        bilan: (b, r) => `${tableauI(r)}. Dernière mesure : l'ampèremètre en I₃.` },
      { titre: 'Montage série du TP : ampèremètre en I₃', num: 5, circuit: () => S.tpSerie({ A: [3] }), rappel: RAPPEL_A,
        bilan: (b, r) => `${tableauI(r)}. Les trois intensités sont égales : dans un circuit en série, l'intensité est la même en tout point (vu au collège).` },
    ],
    3: [
      { titre: 'Deux lampes en dérivation', circuit: () => S.ll(), mesures: null,
        bilan: () => 'Chaque lampe est sur sa branche, branchée directement aux bornes du générateur : les deux brillent normalement.' },
      { titre: 'Lampe et moteur en dérivation, interrupteur dans la branche principale', circuit: () => S.kxy({ x: ['L', 'lampe'], y: ['M', 'moteur'], table: ['M', 'K', 'L'] }), mesures: null,
        bilan: () => 'L\'interrupteur est dans la branche principale : il commande à la fois la lampe et le moteur.' },
      { titre: 'Dérivation du TP : trois ampèremètres', circuit: () => S.tpDerivation({ A: true }), rappel: RAPPEL_A,
        bilan: b => `Mesures : ${['I_1', 'I_2', 'I_3'].map(n => b.mesures[n] ? `${ind(n)} = ${b.mesures[n].texte}` : '').filter(Boolean).join(' ; ')}.` },
      { titre: 'Montage série du TP : trois voltmètres', circuit: () => S.tpSerie({ V: true }), com: true, rappel: RAPPEL_V,
        bilan: b => `Mesures : ${['U_G', 'U_390', 'U_100'].map(n => b.mesures[n] ? `${ind(n)} = ${b.mesures[n].texte}` : '').filter(Boolean).join(' ; ')}. Chaque voltmètre est une dérivation : le circuit n'a pas été modifié.` },
      { titre: 'Loi d\'Ohm : ampèremètre en série, voltmètre en dérivation', circuit: () => S.ohm(8), rappel: RAPPEL_V,
        bilan: b => `Mesures : ${['U', 'I'].map(n => b.mesures[n] ? `${n} = ${b.mesures[n].texte}` : '').filter(Boolean).join(' ; ')}.` },
    ],
  };

  function manip(zone, n) {
    const L = SITUATIONS[n], total = Math.max(...L.map((s, i) => s.num || i + 1));
    const suiteModule = n === 2 ? ['module_3_manip.html', 'Module 3 : ajouter des dérivations →'] : ['module_4_questions.html', 'Module 4 : montages du TP →'];
    let k = 0;
    const faits = new Set(), resultats = {};
    function afficher() {
      const s = L[k];
      zone.innerHTML = `<div class="me-sit-tete"><h3 class="me-sit-titre">${s.titre}${s.rappel ? BULLE.info(s.rappel, 'Rappel') : ''}</h3><span class="me-sit-num">Situation ${s.num || k + 1} / ${total}</span></div>
        <div class="me-poste"></div><div class="me-bilan" aria-live="polite"></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < L.length - 1 ? 'Situation suivante →' : suiteModule[1]}</button></div>`;
      const c = s.circuit();
      const aMesurer = c.dipoles.some(d => d.type === 'amperemetre' || d.type === 'voltmetre');
      ME.posteEnCours = MONTAGE.monter(zone.querySelector('.me-poste'), c, {      // poste en cours (utile pour vérifier l'application)
        boucle: true, com: !!s.com, mesures: s.mesures !== undefined ? s.mesures : (aMesurer ? 'lire' : null),
        onFin(b) {
          Object.assign(resultats, b.mesures);
          zone.querySelector('.me-bilan').innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Bravo !</b> ${s.bilan(b, resultats)}</p></div>`;
          zone.querySelector('[data-a="suite"]').disabled = false;
          faits.add(k);
          if (faits.size === L.length) SOM.marquer({ fait: true });
          setTimeout(() => zone.querySelector('.me-bilan').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        },
      });
      zone.querySelector('[data-a="re"]').onclick = afficher;
      zone.querySelector('[data-a="suite"]').onclick = () => {
        if (k < L.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = suiteModule[0];
      };
    }
    afficher();
  }

  /* ============================================================
     MODULE 4 : SÉRIE NOTÉE SUR 20 (10 montages)
     Chaque question : surligner la boucle, réaliser le montage, lire une mesure.
     2 points sans refus ; 1 point avec un ou deux refus ; 0 au-delà ou si « Afficher le montage ».
     ============================================================ */
  const GROUPES = [
    () => { const k = hasard([1, 2, 3]); return { theme: 'TP · circuit en série', circuit: S.tpSerie({ A: [1, 2, 3] }), mesure: 'I_' + k }; },
    () => ({ theme: 'TP · circuit en série', circuit: S.tpSerie({ V: true }), mesure: hasard(['U_G', 'U_390', 'U_100']) }),
    () => ({ theme: 'TP · circuit en dérivation', circuit: S.tpDerivation({ A: true }), mesure: hasard(['I_1', 'I_2', 'I_3']) }),
    () => ({ theme: 'TP · circuit en dérivation', circuit: S.tpDerivationV(), mesure: hasard(['U_G', 'U_390', 'U_100']) }),
    () => ({ theme: 'TP · loi d\'Ohm', circuit: S.ohm(hasard([4, 5, 6, 8, 10])), mesure: hasard(['U', 'I']) }),
    () => ({ theme: 'Lampes en dérivation', circuit: S.ll({ A: true }), mesure: 'I' }),
    () => ({ theme: 'Lampe et moteur en dérivation', circuit: S.kxy({ x: ['L', 'lampe'], y: ['M', 'moteur'], A: true }), mesure: 'I_M' }),
    () => ({ theme: 'Deux dérivations', circuit: S.trois(), mesure: 'I' }),
  ];
  function tirage() {
    const l = melanger(GROUPES.slice()).concat(melanger(GROUPES.slice()).slice(0, 2));
    return l.slice(0, 10).map(f => f());
  }
  // lecture d'une saisie « 16,3 mA » → { v (unités SI), famille 'A' | 'V' } ou null
  function lireValeur(t) {
    const m = String(t).trim().replace(/\s+/g, ' ').replace('−', '-').match(/^(-?\d+(?:[.,]\d+)?)\s*(ma|a|mv|v)$/i);
    if (!m) return null;
    const v = parseFloat(m[1].replace(',', '.')), u = m[2].toLowerCase();
    return { v: u.startsWith('m') ? v / 1000 : v, famille: u.endsWith('a') ? 'A' : 'V' };
  }
  // valeur vraie mesurée par l'appareil nommé (intensité qui le traverse ou tension à ses bornes)
  function valeurVraie(poste, nom) {
    const st = poste.etat, d = poste.circuit.dipoles.find(x => x.mesure === nom), m = st.assign[d.id];
    if (!m || !st.res) return null;
    return d.type === 'amperemetre' ? st.res.I[m] || 0 : st.res.V[m + '.V'] - st.res.V[m + '.COM'];
  }

  function serie(app) {
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;
    const badge = 'MODULE 4 · ENTRAÎNEMENT', titre = 'Montages du TP';
    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${badge}</span><h2 class="er-titre">${titre}</h2>
        <p class="er-contexte">10 montages tirés au hasard : les schémas du TP et des circuits à lampes, interrupteur et moteur. Pour chacun : surligne la <b>boucle principale</b>, réalise le <b>montage</b>, puis <b>lis la mesure</b> demandée.</p>
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · 10 montages, notés sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si aucun branchement n'est refusé et si la lecture est juste du premier coup ;</li>
          <li><b>1 point</b> avec une ou deux erreurs (branchement refusé ou lecture fausse) ;</li>
          <li><b>0 point</b> au-delà, ou si tu demandes « Afficher le montage ».</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = tirage(); idx = 0; score = 0; recap = []; afficher(); }
    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx], d = q.circuit.dipoles.find(x => x.mesure === q.mesure), grandeur = d.type === 'amperemetre' ? 'l\'intensité' : 'la tension';
      app.innerHTML = `<div class="er-card"><span class="er-badge">${badge}</span><h2 class="er-titre">${titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">
          <p class="er-q-nom">${q.theme}</p>
          <div class="er-consigne">Réalise le montage du schéma (générateur réglé sur ${fr(q.circuit.tension)} V), puis lis ${grandeur} <b>${ind(q.mesure)}</b>.</div>
          <div class="me-poste"></div>
          <div class="me-aide"><button type="button" class="btn-small" data-a="montrer">Afficher le montage (0 point)</button></div>
          <div class="me-lecture hidden"></div>
          <div data-a="retour"></div><div class="er-actions" data-a="suite"></div></div>`;
      window.scrollTo(0, 0);
      app.style.pointerEvents = 'none';
      setTimeout(() => { app.style.pointerEvents = ''; }, 350);
      let erreursLecture = 0;
      const poste = MONTAGE.monter(app.querySelector('.me-poste'), q.circuit, {
        boucle: true, mesures: null, tensionReglee: true, montrerMesures: [q.mesure],
        onFin() { lecture(); },
      });
      ME.posteEnCours = poste;
      app.querySelector('[data-a="montrer"]').onclick = e => { e.target.disabled = true; poste.montrer(); };
      function lecture() {
        const z = app.querySelector('.me-lecture');
        if (!z.classList.contains('hidden')) return;
        z.classList.remove('hidden');
        z.innerHTML = `<p class="ph-partie-q">Règle ${d.type === 'amperemetre' ? 'l\'ampèremètre' : 'le voltmètre'} de ${ind(q.mesure)}, puis écris la valeur lue <b>avec son unité</b> (par exemple ${d.type === 'amperemetre' ? '16,3 mA' : '6,37 V'}).</p>
          <div class="ph-valeur"><span class="ph-lab">${ind(q.mesure)} =</span><input type="text" class="ph-champ me-champ" inputmode="text" autocomplete="off" spellcheck="false" aria-label="Valeur lue avec son unité">
          <button type="button" class="btn-primary" data-a="valider">Valider</button></div><div class="me-lecture-retour"></div>`;
        const ch = z.querySelector('input'), ret = z.querySelector('.me-lecture-retour');
        const valider = () => {
          const r = lireValeur(ch.value);
          if (!r) { ret.innerHTML = '<p class="ph-msg">Écris un nombre suivi de son unité, par exemple 16,3 mA ou 6,37 V.</p>'; return; }
          const vrai = valeurVraie(poste, q.mesure);
          const famille = d.type === 'amperemetre' ? 'A' : 'V';
          let diag = null;
          if (r.famille !== famille) diag = famille === 'A' ? 'Une intensité s\'exprime en ampères (A ou mA).' : 'Une tension s\'exprime en volts (V ou mV).';
          else if (Math.abs(Math.abs(r.v) - Math.abs(vrai)) > Math.max(.03 * Math.abs(vrai), 1e-4)) {
            diag = famille === 'A' && Math.abs(Math.abs(r.v) * 1000 - Math.abs(vrai)) < .03 * Math.abs(vrai) ? 'Attention à l\'unité : l\'écran affiche des mA quand le calibre est en mA.'
              : 'Relis l\'écran du multimètre : choisis la bonne fonction et le calibre le plus adapté pour une lecture précise.';
          }
          if (diag) { erreursLecture++; ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p></div>`; return; }
          ch.disabled = true; z.querySelector('[data-a="valider"]').disabled = true;
          const err = poste.refus + erreursLecture, p = poste.montre ? 0 : err === 0 ? 2 : err <= 2 ? 1 : 0;
          terminer(p, err, Math.abs(vrai));
        };
        z.querySelector('[data-a="valider"]').onclick = valider;
        ch.addEventListener('keydown', e => { if (e.key === 'Enter') valider(); });
        if (matchMedia('(hover: hover)').matches) ch.focus();
        setTimeout(() => z.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
      }
      function terminer(p, err, vrai) {
        app.querySelector('.me-aide').remove();
        score += p; recap.push({ n: idx + 1, p });
        app.querySelector('[data-a="score"]').textContent = pts(score);
        const t = p === 2 ? 'Bravo, sans erreur !' : poste.montre ? 'Le montage a été affiché.' : `Juste, avec ${err} erreur${err > 1 ? 's' : ''}.`;
        const unite = d.type === 'amperemetre' ? (vrai < .2 ? `${fr(vrai * 1000, 1)} mA` : `${fr(vrai, 2)} A`) : `${fr(vrai, 2)} V`;
        app.querySelector('[data-a="retour"]').innerHTML = `<div class="${p ? 'callout-success' : 'callout'} er-retour ph-bilan"><p><b class="${p ? 'er-ok' : ''}">${t}</b> +${pts(p)}</p><p>${ind(q.mesure)} = ${unite}.</p></div>`;
        const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
        s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
        const b = s.querySelector('button');
        setTimeout(() => { b.disabled = false; }, 450);
        b.onclick = () => { idx++; afficher(); };
        setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
      }
    }
    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      SOM.marquer({ note });
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les montages changent à chaque fois.' : 'Continue à t\'entraîner : refais les modules 2 et 3, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${fr(note)} / 20</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres montages</button>
          <a class="btn-secondary" style="text-decoration:none" href="module_3_manip.html">Revoir les dérivations</a>
          <a class="btn-primary" style="text-decoration:none" href="../index.html">Accueil de l'application</a></div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }
    intro();
  }
  function confettis() {
    const col = ['#5a3fc4', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const e = document.createElement('div');
      e.className = 'er-confetti';
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.background = col[i % col.length];
      e.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      e.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 4800);
    }
  }

  window.ME = { PLAN, SCHEMAS: S, lire, manip, serie, lireValeur, LECTURES, SITUATIONS, GROUPES };
})();
