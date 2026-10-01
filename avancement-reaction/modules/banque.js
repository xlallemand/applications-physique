/* ============================================================
   Banque de réactions et fabrication des questions d'entraînement

   Les quantités initiales sont tirées au hasard, mais choisies pour
   que les calculs « tombent juste » : x_max et les quantités finales
   s'écrivent simplement (entiers, 1 ou 2 décimales, ou 2 chiffres
   significatifs en écriture scientifique). Il n'y a jamais d'égalité
   entre les deux hypothèses (un seul réactif limitant).
   ============================================================ */
(function () {
  'use strict';

  const R = (eq, nom) => {
    // « 2 H2 + O2 -> 2 H2O » → { r, p, c, nom }
    const [g, d] = eq.split('->').map(s => s.trim().split(' + ').map(t => {
      const m = /^(\d+)\s+(.+)$/.exec(t.trim());
      return m ? { c: +m[1], f: m[2] } : { c: 1, f: t.trim() };
    }));
    return { r: g.map(x => x.f), p: d.map(x => x.f), c: g.concat(d).map(x => x.c), nom };
  };

  const REACTIONS = {
    // ---------- Seconde ----------
    simples: [
      R('2 H2 + O2 -> 2 H2O', "Synthèse de l'eau"),
      R('N2 + 3 H2 -> 2 NH3', "Synthèse de l'ammoniac"),
      R('2 CO + O2 -> 2 CO2', 'Combustion du monoxyde de carbone'),
      R('2 Mg + O2 -> 2 MgO', 'Combustion du magnésium'),
      R('2 Cu + O2 -> 2 CuO', 'Oxydation du cuivre'),
      R('2 Na + Cl2 -> 2 NaCl', 'Synthèse du chlorure de sodium'),
      R('2 Zn + O2 -> 2 ZnO', 'Oxydation du zinc'),
      R('H2 + Cl2 -> 2 HCl', "Synthèse du chlorure d'hydrogène"),
    ],
    quatre: [
      R('CH4 + 2 O2 -> CO2 + 2 H2O', 'Combustion du méthane'),
      R('C2H6O + 3 O2 -> 2 CO2 + 3 H2O', "Combustion de l'éthanol"),
      R('2 H2S + 3 O2 -> 2 SO2 + 2 H2O', "Combustion du sulfure d'hydrogène"),
      R('Zn + 2 HCl -> ZnCl2 + H2', "Action de l'acide chlorhydrique sur le zinc"),
      R('Fe + 2 HCl -> FeCl2 + H2', "Action de l'acide chlorhydrique sur le fer"),
      R('2 Na + 2 H2O -> 2 NaOH + H2', "Action de l'eau sur le sodium"),
      R('C2H4 + 3 O2 -> 2 CO2 + 2 H2O', "Combustion de l'éthylène"),
      R('2 CuO + C -> 2 Cu + CO2', "Réduction de l'oxyde de cuivre par le carbone"),
    ],
    grands: [
      R('C3H8 + 5 O2 -> 3 CO2 + 4 H2O', 'Combustion du propane'),
      R('4 Fe + 3 O2 -> 2 Fe2O3', 'Formation de la rouille'),
      R('4 Al + 3 O2 -> 2 Al2O3', "Oxydation de l'aluminium"),
      R('2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O', "Combustion de l'éthane"),
      R('4 NH3 + 3 O2 -> 2 N2 + 6 H2O', "Combustion de l'ammoniac"),
      R('2 Al + 6 HCl -> 2 AlCl3 + 3 H2', "Action de l'acide chlorhydrique sur l'aluminium"),
      R('2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O', 'Combustion du butane'),
    ],
    // ---------- Première ----------
    ions1: [
      R('Pb2+ + 2 I- -> PbI2', "Précipitation de l'iodure de plomb"),
      R('Ag+ + Cl- -> AgCl', "Précipitation du chlorure d'argent"),
      R('Cu2+ + 2 HO- -> Cu(OH)2', "Précipitation de l'hydroxyde de cuivre"),
      R('Zn + 2 H+ -> Zn2+ + H2', "Action d'un acide sur le zinc"),
      R('Fe + 2 H+ -> Fe2+ + H2', "Action d'un acide sur le fer"),
      R('Zn + Cu2+ -> Zn2+ + Cu', 'Réaction entre le zinc et les ions cuivre'),
      R('Fe2+ + 2 HO- -> Fe(OH)2', "Précipitation de l'hydroxyde de fer II"),
    ],
    ions2: [
      R('Fe3+ + 3 HO- -> Fe(OH)3', "Précipitation de l'hydroxyde de fer III"),
      R('Al3+ + 3 HO- -> Al(OH)3', "Précipitation de l'hydroxyde d'aluminium"),
      R('Cu + 2 Ag+ -> Cu2+ + 2 Ag', 'Réaction entre le cuivre et les ions argent'),
      R('Fe + 2 Ag+ -> Fe2+ + 2 Ag', 'Réaction entre le fer et les ions argent'),
      R('CH4 + 2 O2 -> CO2 + 2 H2O', 'Combustion du méthane'),
      R('C2H6O + 3 O2 -> 2 CO2 + 3 H2O', "Combustion de l'éthanol"),
    ],
    ions3: [
      R('2 Al + 6 H+ -> 2 Al3+ + 3 H2', "Action d'un acide sur l'aluminium"),
      R('2 Al + 3 Cu2+ -> 2 Al3+ + 3 Cu', "Réaction entre l'aluminium et les ions cuivre"),
      R('C3H8 + 5 O2 -> 3 CO2 + 4 H2O', 'Combustion du propane'),
      R('CaCO3 + 2 H+ -> Ca2+ + CO2 + H2O', "Action d'un acide sur le calcaire"),
      R('4 Fe + 3 O2 -> 2 Fe2O3', 'Formation de la rouille'),
      R('2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O', "Combustion de l'éthane"),
    ],
  };

  const hasard = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  // nombre de chiffres significatifs d'un entier (zéros de fin non comptés)
  const chiffres = n => String(Math.abs(n)).replace(/0+$/, '').length || 1;

  /* ---------- Quantités initiales ----------
     Tout est compté en « unités » u : x_max = a·u, rapport n0/c d'un réactif en excès = b·u (b > a).
     n0 = c·b·u, n final (réactif) = c·(b − a)·u, n final (produit) = c·a·u.
     niveau = { mode, u, a: [min, max], d: [min, max], chiffres }  (d = b − a)            */
  function quantites(reac, niv) {
    for (let essai = 0; essai < 500; essai++) {
      const nR = reac.r.length, L = hasard(0, nR - 1), a = hasard(niv.a[0], niv.a[1]);
      const b = reac.r.map((_, k) => (k === L ? a : a + hasard(niv.d[0], niv.d[1])));
      // un seul réactif limitant : tous les autres rapports strictement plus grands et distincts
      if (new Set(b).size !== b.length) continue;
      const entiers = reac.r.map((_, k) => reac.c[k] * b[k])
        .concat(reac.r.map((_, k) => reac.c[k] * (b[k] - a)).filter(v => v))
        .concat(reac.p.map((_, j) => reac.c[nR + j] * a));
      if (niv.chiffres && entiers.some(v => chiffres(v) > niv.chiffres)) continue;
      const n0 = reac.r.map((_, k) => Math.round(reac.c[k] * b[k] * niv.u * 1e12) / 1e12).concat(reac.p.map(() => 0));
      return Object.assign({}, reac, { n0, mode: niv.mode });
    }
    throw new Error('quantités impossibles pour ' + reac.nom);
  }

  // Niveaux de difficulté (u : unité de base)
  const NIVEAUX = {
    entier: { mode: 'decimal', u: 1, a: [1, 4], d: [1, 3] },
    dixieme: { mode: 'decimal', u: 0.1, a: [1, 9], d: [1, 5] },
    centieme: { mode: 'decimal', u: 0.05, a: [2, 9], d: [1, 6] },
    puissance: e => ({ mode: 'puissance', u: Math.pow(10, e - 1), a: [10, 60], d: [5, 40], chiffres: 2 }),
  };

  // Série de questions : [{ liste, niveau (ou fonction), nombre }]
  function serie(parts) {
    let qs = [];
    parts.forEach(p => {
      window.AV.melanger(REACTIONS[p.liste]).slice(0, p.nombre).forEach(reac => {
        const niv = typeof p.niveau === 'function' ? p.niveau() : p.niveau;
        qs.push(quantites(reac, niv));
      });
    });
    return qs;
  }
  const exposant = l => () => NIVEAUX.puissance(l[Math.floor(Math.random() * l.length)]);

  window.BANQUE = {
    REACTIONS, quantites, NIVEAUX,
    // Entraînement niveau seconde
    seconde: () => serie([
      { liste: 'simples', niveau: NIVEAUX.entier, nombre: 3 },
      { liste: 'quatre', niveau: NIVEAUX.dixieme, nombre: 4 },
      { liste: 'grands', niveau: NIVEAUX.centieme, nombre: 3 },
    ]),
    // Entraînement niveau première (puissances de 10)
    premiere: () => serie([
      { liste: 'ions1', niveau: exposant([-2, -3]), nombre: 3 },
      { liste: 'ions2', niveau: exposant([-2, -3, -4]), nombre: 4 },
      { liste: 'ions3', niveau: exposant([-2, -3, -4]), nombre: 3 },
    ]),
  };
})();
