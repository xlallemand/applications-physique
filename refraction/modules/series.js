/* ============================================================
   Module 4 : exercices d'application (série notée sur 20)
   RF.questionsSerie()   10 questions, au plus 3 avec un calcul (2 d'angles, 1 d'indice) :
     choisir le bon schéma (×2) ; comparer i₁ et i₂ sans calcul (×2) ; écrire la loi (×2) ;
     incidence normale ; calculer i₂ ; calculer i₁ à partir de i₂ ; calculer un indice.
   Les calculs suivent la méthode du niveau seconde : loi, valeurs numériques, sinus (ou indice), Arcsin.
   ============================================================ */
(function () {
  'use strict';

  const fmt = RF.fmt, nH = RF.nHTML, iH = RF.iHTML, M = RF.MILIEUX, hasard = RF.hasard;
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // angle donné : entier (2 chiffres significatifs), « ,0 » ou au dixième (3 chiffres significatifs)
  function angleDonne(min, max) {
    const t = hasard(['entier', 'zero', 'dixieme']);
    if (t === 'entier') return { v: entre(min, max), dec: 0, cs: 2 };
    if (t === 'zero') return { v: entre(min, max), dec: 1, cs: 3 };
    return { v: entre(min * 10, max * 10) / 10, dec: 1, cs: 3 };
  }
  const txtA = (a, dec) => fmt(a, dec) + '°';

  // situation dessinée : surface horizontale ou verticale, la lumière va du milieu 1 au milieu 2
  function situation(m1, m2, i1, o) {
    o = o || {};
    const eau = m1 === 'eau' || m2 === 'eau';
    const base = eau
      ? (m2 === 'eau' || (m1 === 'eau' && m2 !== 'air') ? { alpha: 0, n2: -90 } : { alpha: 0, n2: 90 })
      : hasard([{ alpha: 0, n2: -90 }, { alpha: 90, n2: 0 }]);
    return Object.assign({ id: 'serie', titre: `${M[m1].nom} → ${M[m2].nom}`, texte: '', m1, m2, type: o.demi ? 'demi' : 'plan', sens: hasard([1, -1]), i1,
      refracte: true, reflechi: false, source: 'lampe' }, base, o.demi ? { alpha: 90, n2: 0 } : {}, o.sit || {});
  }
  const orientation = () => ({ rot: 0, miroir: Math.random() < 0.5 });
  // figure de la question (schéma complet, valeurs écrites ; sans les noms des rayons, la figure est petite)
  const fig = (s, orient, valeurs) => zone => RF.figure(zone, s, orient, { valeurs, sansEtiquettes: true });
  const PAIRES = [['air', 'eau'], ['air', 'verre'], ['eau', 'verre'], ['eau', 'air'], ['verre', 'air'], ['verre', 'eau'], ['air', 'plexi']];

  /* ---------- Choisir le bon schéma parmi trois ---------- */
  function schemaCorrect() {
    const [m1, m2] = hasard(PAIRES), i1 = entre(25, 50);
    const s = situation(m1, m2, i1), orient = orientation();
    const opts = RF.melanger([
      { id: 'ok', figure: b => RF.figure(b, s, orient, { sansEtiquettes: true, aria: 'Schéma' }) },
      { id: 'surf', figure: b => RF.figure(b, s, orient, { anglesSurface: true, sansEtiquettes: true, aria: 'Schéma' }) },
      { id: 'inv', figure: b => RF.figure(b, s, orient, { milieuxInverses: true, sansEtiquettes: true, aria: 'Schéma' }) },
    ]);
    opts.forEach((o, i) => { o.label = 'Schéma ' + 'ABC'[i]; });
    return {
      theme: 'Le schéma de la réfraction',
      enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le}.</p>`,
      parties: [
        { type: 'choix', figures: true, q: 'Choisis le schéma correct de la situation.', options: opts, bonne: 'ok', melanger: false,
          indices: { surf: 'Les angles se mesurent depuis la normale, pas depuis la surface.', inv: 'Le milieu 1 est celui qui contient le rayon incident.' },
          solution: `Angles mesurés depuis la normale : ${iH(1)} (angle d'incidence) et ${iH(2)} (angle de réfraction) ; le milieu 1 contient le rayon incident, le milieu 2 le rayon réfracté.` },
        { type: 'choix', q: `Comment s'appelle l'angle ${iH(2)} ?`, melanger: false,
          options: [{ id: 'r', label: 'l\'angle de réfraction' }, { id: 'i', label: 'l\'angle d\'incidence' }, { id: 'f', label: 'l\'angle de réflexion' }], bonne: 'r',
          indices: { i: `${iH(1)} est l'angle d'incidence (rayon incident) ; ${iH(2)} est entre la normale et le rayon réfracté.`, f: `Il n'y a pas de rayon réfléchi ici : ${iH(2)} est entre la normale et le rayon réfracté.` },
          solution: `${iH(2)} est l'angle de réfraction, entre la normale et le rayon réfracté.` },
      ],
    };
  }

  /* ---------- Comparer i₁ et i₂ sans calcul ---------- */
  function comparer() {
    const [m1, m2] = hasard(PAIRES);
    const n1 = M[m1].n, n2 = M[m2].n, a1 = nH(M[m1].sym), a2 = nH(M[m2].sym);
    const rapproche = n2 > n1;
    const pourquoi = rapproche
      ? `${a2} > ${a1} : dans ${a1} × sin(${iH(1)}) = ${a2} × sin(${iH(2)}), sin(${iH(2)}) est plus petit que sin(${iH(1)}), donc ${iH(2)} < ${iH(1)} : le rayon réfracté se rapproche de la normale.`
      : `${a1} > ${a2} : dans ${a1} × sin(${iH(1)}) = ${a2} × sin(${iH(2)}), sin(${iH(2)}) est plus grand que sin(${iH(1)}), donc ${iH(2)} > ${iH(1)} : le rayon réfracté s'éloigne de la normale.`;
    const i1 = entre(20, 40);
    return {
      theme: 'Comparer i<sub>1</sub> et i<sub>2</sub> sans calcul',
      enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le} avec un angle d'incidence ${iH(1)} = ${i1}°.</p><p class="rf-donnees">${a1} = ${fmt(n1, 2)} ; ${a2} = ${fmt(n2, 2)}</p>`,
      parties: [
        { type: 'choix', q: 'Sans calcul : que fait le rayon réfracté ?',
          options: [{ id: 'r', label: 'Il se rapproche de la normale.' }, { id: 'e', label: 'Il s\'éloigne de la normale.' }, { id: 'n', label: 'Il n\'est pas dévié.' }],
          bonne: rapproche ? 'r' : 'e', melanger: false, colonne: true,
          indices: { r: pourquoi, e: pourquoi, n: `Seul un rayon qui arrive perpendiculairement à la surface (${iH(1)} = 0°) n'est pas dévié.` },
          solution: pourquoi },
        { type: 'choix', q: `Compare ${iH(1)} et ${iH(2)}.`,
          options: [{ id: 'p', label: `${iH(2)} < ${iH(1)}` }, { id: 'g', label: `${iH(2)} > ${iH(1)}` }, { id: 'e', label: `${iH(2)} = ${iH(1)}` }],
          bonne: rapproche ? 'p' : 'g', melanger: false,
          indices: { p: pourquoi, g: pourquoi, e: 'Le rayon change de direction en changeant de milieu : les deux angles sont différents.' } },
      ],
    };
  }

  /* ---------- Écrire la loi pour une situation ---------- */
  function ecrireLoi() {
    const [m1, m2] = hasard(PAIRES), i1 = entre(25, 50);
    const s = situation(m1, m2, i1), orient = orientation();
    const loi = RF.partiesCalcul({ m1, m2, i1, inconnue: 's2', valeurs: true })[0];
    return {
      theme: 'Écrire la loi de Descartes',
      enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le}.</p>`,
      figure: fig(s, orient, null),
      parties: [loi],
    };
  }

  /* ---------- Incidence normale ---------- */
  function incidenceNormale() {
    const [m1, m2] = hasard([['air', 'eau'], ['air', 'verre'], ['eau', 'air'], ['verre', 'air']]);
    const s = situation(m1, m2, 0), orient = orientation();
    const choix = k => ({
      type: 'choix', q: `Que vaut l'angle ${k === '1' ? 'd\'incidence' : 'de réfraction'} ${iH(k)} ?`, melanger: false,
      options: [{ id: '0', label: `${iH(k)} = 0°` }, { id: '90', label: `${iH(k)} = 90°` }, { id: 'calc', label: `On ne peut pas le savoir sans calcul.` }], bonne: '0',
      indices: { 90: 'Les angles se mesurent depuis la normale, pas depuis la surface : ici, le rayon est confondu avec la normale.',
        calc: k === '1' ? 'Le rayon incident est confondu avec la normale : son angle avec la normale est nul.' : `Un rayon qui arrive perpendiculairement à la surface n'est pas dévié : sin(${iH(2)}) = 0, donc ${iH(2)} = 0°.` },
      solution: k === '1' ? `Le rayon incident est confondu avec la normale : ${iH(1)} = 0°.` : `${nH(M[m1].sym)} × sin(0°) = 0, donc sin(${iH(2)}) = 0 et ${iH(2)} = 0° : le rayon n'est pas dévié.`,
    });
    return {
      theme: 'Incidence normale',
      enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le} en arrivant perpendiculairement à la surface de séparation.</p><p class="rf-donnees">${nH(M[m1].sym)} = ${fmt(M[m1].n, 2)} ; ${nH(M[m2].sym)} = ${fmt(M[m2].n, 2)}</p>`,
      figure: fig(s, orient, null),
      parties: [choix('1'), choix('2')],
      bilan: `${iH(1)} = 0° et ${iH(2)} = 0° : le rayon n'est pas dévié.`,
    };
  }

  /* ---------- Calculs (niveau seconde : loi, valeurs, sinus ou indice, Arcsin) ---------- */
  // calculer i₂ (milieu 1 → milieu 2)
  function calculerI2() {
    const [m1, m2] = hasard([['air', 'eau'], ['air', 'verre'], ['eau', 'verre'], ['air', 'plexi']]), a = angleDonne(15, 65);
    const s = situation(m1, m2, a.v, { demi: m2 === 'plexi' }), orient = m2 === 'plexi' ? { rot: hasard([0, 2]), miroir: false } : orientation();
    const c = { m1, m2, i1: a.v, dec: a.dec, inconnue: 's2', csAngle: a.cs, valeurs: true };
    return {
      theme: 'Calculer un angle de réfraction',
      enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le} avec un angle d'incidence ${iH(1)} = ${txtA(a.v, a.dec)}.</p><p class="rf-donnees">${nH(M[m1].sym)} = ${fmt(M[m1].n, 2)} ; ${nH(M[m2].sym)} = ${fmt(M[m2].n, 2)}</p>`,
      figure: fig(s, orient, { i1: txtA(a.v, a.dec), i2: '?' }),
      parties: RF.partiesCalcul(c),
    };
  }
  // calculer i₁ à partir de i₂ (la lumière sort de l'eau ou du verre)
  function calculerI1() {
    const m1 = hasard(['eau', 'verre']), a = angleDonne(15, 60);
    const i1 = RF.asinD(M.air.n * RF.sinD(a.v) / M[m1].n);
    const s = situation(m1, 'air', i1), orient = orientation();
    const c = { m1, m2: 'air', i2: a.v, dec: a.dec, inconnue: 's1', csAngle: a.cs, valeurs: true };
    return {
      theme: 'Calculer un angle d\'incidence',
      enonce: `<p>Un rayon de lumière sort de ${M[m1].le} et passe dans l'air. L'angle de réfraction vaut ${iH(2)} = ${txtA(a.v, a.dec)}.</p><p class="rf-donnees">${nH(M[m1].sym)} = ${fmt(M[m1].n, 2)} ; ${nH('air')} = 1,00</p>`,
      figure: fig(s, orient, { i1: '?', i2: txtA(a.v, a.dec) }),
      parties: RF.partiesCalcul(c),
    };
  }
  // calculer un indice : plexiglas, eau (demi-cylindres), milieu inconnu
  function calculerIndice() {
    const m2 = hasard(['plexi', 'eau', 'inconnu']);
    const n = m2 === 'inconnu' ? entre(130, 170) / 100 : M[m2].n;
    const i1 = entre(35, 70);
    const i2 = Math.round(RF.asinD(RF.sinD(i1) / n) * 10) / 10;
    const s = situation('air', m2, i1, { demi: m2 !== 'inconnu', sit: { nM2: n, cacheN2: true } }), orient = { rot: hasard([0, 2]), miroir: false };
    const c = { m1: 'air', m2, n2: n, i1, i2, dec: 1, inconnue: 'n2', valeurs: true };
    const objet = m2 === 'inconnu' ? 'un bloc d\'un matériau inconnu' : m2 === 'eau' ? 'une cuve en demi-cylindre remplie d\'eau (paroi très fine)' : 'un demi-cylindre de plexiglas';
    return {
      theme: 'Calculer un indice de réfraction',
      enonce: `<p>Un rayon de lumière passe de l'air dans ${objet}. On mesure ${iH(1)} = ${txtA(i1, 1)} et ${iH(2)} = ${txtA(i2, 1)}.</p><p class="rf-donnees">${nH('air')} = 1,00</p>`,
      figure: fig(s, orient, { i1: txtA(i1, 1), i2: txtA(i2, 1) }),
      parties: RF.partiesCalcul(c),
    };
  }

  const GROUPES = { schema: schemaCorrect, comparer, loi: ecrireLoi, normale: incidenceNormale, i2: calculerI2, i1: calculerI1, indice: calculerIndice };
  function questionsSerie() {
    const liste = ['schema', 'schema', 'comparer', 'comparer', 'loi', 'loi', 'normale', 'i2', 'i1', 'indice'];
    return RF.melanger(liste).map(g => GROUPES[g]());
  }

  Object.assign(RF, { questionsSerie, GROUPES_SERIE: GROUPES });
})();
