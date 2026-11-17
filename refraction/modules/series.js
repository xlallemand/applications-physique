/* ============================================================
   Module 4 : calculer un angle ou un indice (série notée sur 20)
   RF.questionsSerie()   10 questions tirées au hasard dans des groupes :
     calculer i₂ (air → eau, air → verre, eau → verre) ; calculer i₁ à partir de i₂ (eau → air, verre → air) ;
     calculer un indice (plexiglas, eau, milieu inconnu) ; incidence normale ; données de mesures
     (air → plexiglas) ; comparer i₁ et i₂ sans calcul.
   Chaque question suit la méthode, en parties successives : (a) choisir le bon schéma parmi trois ;
   (b) écrire la loi avec les étiquettes ; (c) expression littérale ; (d) valeur du sinus ; (e) angle ou indice.
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
  const orientation = s => (s.m1 === 'eau' || s.m2 === 'eau' ? { rot: 0, miroir: Math.random() < 0.5 } : { rot: 0, miroir: Math.random() < 0.5 });
  // figure (schéma complet, valeurs écrites) au-dessus d'une partie
  const fig = (s, orient, valeurs) => zone => { const d = RF.el('div', 'rf-q-mini'); zone.appendChild(d); RF.figure(d, s, orient, { valeurs }); };

  // (a) choisir le bon schéma parmi trois
  function partieSchema(s, orient) {
    return {
      type: 'choix', figures: true, q: 'Choisis le schéma correct de la situation.',
      options: [
        { id: 'ok', label: 'Schéma A', figure: b => RF.figure(b, s, orient, { sansEtiquettes: true, aria: 'Schéma' }) },
        { id: 'surf', label: 'Schéma B', figure: b => RF.figure(b, s, orient, { anglesSurface: true, sansEtiquettes: true, aria: 'Schéma' }) },
        { id: 'inv', label: 'Schéma C', figure: b => RF.figure(b, s, orient, { milieuxInverses: true, sansEtiquettes: true, aria: 'Schéma' }) },
      ],
      bonne: 'ok',
      indices: { surf: 'Les angles se mesurent depuis la normale, pas depuis la surface.', inv: 'Le milieu 1 est celui qui contient le rayon incident.' },
      solution: 'Angles mesurés depuis la normale ; le milieu 1 contient le rayon incident, le milieu 2 le rayon réfracté.',
    };
  }
  // les lettres A, B, C dans l'ordre d'affichage (les choix sont mélangés)
  function lettres(p) {
    const opts = RF.melanger(p.options);
    opts.forEach((o, i) => { o.label = 'Schéma ' + 'ABC'[i]; });
    p.options = opts; p.melanger = false;
    return p;
  }

  /* ---------- Fabriques de questions ---------- */
  // calculer i₂ (milieu 1 → milieu 2)
  function calculerI2(paires) {
    return () => {
      const [m1, m2] = hasard(paires), a = angleDonne(15, 65);
      const s = situation(m1, m2, a.v), orient = orientation(s);
      const c = { m1, m2, i1: a.v, dec: a.dec, inconnue: 's2', csAngle: a.cs };
      const vals = { i1: txtA(a.v, a.dec), i2: '?' };
      const parties = [lettres(partieSchema(s, orient))].concat(RF.partiesCalcul(c).map(p => Object.assign(p, { figure: fig(s, orient, vals) })));
      return {
        theme: 'Calculer un angle de réfraction',
        enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le} avec un angle d'incidence ${iH(1)} = ${txtA(a.v, a.dec)}.</p><p class="rf-donnees">${nH(M[m1].sym)} = ${fmt(M[m1].n, 2)} ; ${nH(M[m2].sym)} = ${fmt(M[m2].n, 2)}</p>`,
        parties,
      };
    };
  }
  // calculer i₁ à partir de i₂ (la lumière sort de l'eau ou du verre)
  function calculerI1() {
    const m1 = hasard(['eau', 'verre']), a = angleDonne(15, 60);
    const i1 = RF.asinD(M.air.n * RF.sinD(a.v) / M[m1].n);
    const s = situation(m1, 'air', i1), orient = orientation(s);
    const c = { m1, m2: 'air', i2: a.v, dec: a.dec, inconnue: 's1', csAngle: a.cs };
    const vals = { i1: '?', i2: txtA(a.v, a.dec) };
    return {
      theme: 'Calculer un angle d\'incidence',
      enonce: `<p>Un rayon de lumière sort de ${M[m1].le} et passe dans l'air. L'angle de réfraction vaut ${iH(2)} = ${txtA(a.v, a.dec)}.</p><p class="rf-donnees">${nH(M[m1].sym)} = ${fmt(M[m1].n, 2)} ; ${nH('air')} = 1,00</p>`,
      parties: [lettres(partieSchema(s, orient))].concat(RF.partiesCalcul(c).map(p => Object.assign(p, { figure: fig(s, orient, vals) }))),
    };
  }
  // calculer un indice : plexiglas, eau (demi-cylindres), milieu inconnu
  function calculerIndice() {
    const m2 = hasard(['plexi', 'eau', 'inconnu']);
    const n = m2 === 'inconnu' ? entre(130, 170) / 100 : M[m2].n;
    const i1 = entre(35, 70);
    const i2 = Math.round(RF.asinD(RF.sinD(i1) / n) * 10) / 10;
    const s = situation('air', m2, i1, { demi: m2 !== 'inconnu', sit: { nM2: n, cacheN2: true } }), orient = { rot: hasard([0, 2]), miroir: false };
    const c = { m1: 'air', m2, n2: n, i1, i2, dec: 1, inconnue: 'n2' };
    const vals = { i1: txtA(i1, 1), i2: txtA(i2, 1) };
    const objet = m2 === 'inconnu' ? 'un bloc d\'un matériau inconnu' : m2 === 'eau' ? 'une cuve en demi-cylindre remplie d\'eau (paroi très fine)' : 'un demi-cylindre de plexiglas';
    return {
      theme: 'Calculer un indice de réfraction',
      enonce: `<p>Un rayon de lumière passe de l'air dans ${objet}. On mesure ${iH(1)} = ${txtA(i1, 1)} et ${iH(2)} = ${txtA(i2, 1)}.</p><p class="rf-donnees">${nH('air')} = 1,00</p>`,
      parties: [lettres(partieSchema(s, orient))].concat(RF.partiesCalcul(c).map(p => Object.assign(p, { figure: fig(s, orient, vals) }))),
    };
  }
  // incidence normale
  function incidenceNormale() {
    const [m1, m2] = hasard([['air', 'eau'], ['air', 'verre'], ['eau', 'air'], ['verre', 'air']]);
    const s = situation(m1, m2, 0), orient = orientation(s);
    const c = { m1, m2, i1: 0, dec: 0, inconnue: 's2', csAngle: 1, sansExpression: true };
    const parties = RF.partiesCalcul(c).map(p => Object.assign(p, { figure: fig(s, orient, null) }));
    parties.unshift({
      type: 'choix', q: `Le rayon arrive perpendiculairement à la surface. Que vaut l'angle d'incidence ${iH(1)} ?`, figure: fig(s, orient, null),
      options: [{ id: '0', label: `${iH(1)} = 0°` }, { id: '90', label: `${iH(1)} = 90°` }], bonne: '0', melanger: false,
      indices: { 90: 'Les angles se mesurent depuis la normale, pas depuis la surface : ici, le rayon est confondu avec la normale.' },
      solution: `Le rayon incident est confondu avec la normale : ${iH(1)} = 0°.`,
    });
    return {
      theme: 'Incidence normale',
      enonce: `<p>Un rayon de lumière passe de ${M[m1].le} dans ${M[m2].le} en arrivant perpendiculairement à la surface de séparation.</p><p class="rf-donnees">${nH(M[m1].sym)} = ${fmt(M[m1].n, 2)} ; ${nH(M[m2].sym)} = ${fmt(M[m2].n, 2)}</p>`,
      parties,
      bilan: `${iH(1)} = 0°, donc sin(${iH(2)}) = 0 et ${iH(2)} = 0° : le rayon n'est pas dévié.`,
    };
  }
  // données de mesures (air → plexiglas) : i₁ = 25°, 35°, 45° → i₂ ; ou i₂ = 25° → i₁
  function mesures() {
    const versI1 = Math.random() < 0.25;
    const s0 = hasard([25, 35, 45]);
    const i1 = versI1 ? RF.asinD(M.plexi.n * RF.sinD(25)) : s0;
    const s = situation('air', 'plexi', i1, { demi: true }), orient = { rot: hasard([0, 2]), miroir: false };
    const c = versI1 ? { m1: 'air', m2: 'plexi', i2: 25, dec: 0, inconnue: 's1', csAngle: 2 } : { m1: 'air', m2: 'plexi', i1: s0, dec: 0, inconnue: 's2', csAngle: 2 };
    const vals = versI1 ? { i1: '?', i2: '25°' } : { i1: s0 + '°', i2: '?' };
    return {
      theme: 'Mesures avec un demi-cylindre de plexiglas',
      enonce: `<p>Un rayon de lumière arrive de l'air au centre de la face plane d'un demi-cylindre de plexiglas. ${versI1 ? `On veut un angle de réfraction ${iH(2)} = 25°.` : `L'angle d'incidence vaut ${iH(1)} = ${s0}°.`}</p><p class="rf-donnees">${nH('air')} = 1,00 ; ${nH('plexi')} = 1,51</p>`,
      parties: [lettres(partieSchema(s, orient))].concat(RF.partiesCalcul(c).map(p => Object.assign(p, { figure: fig(s, orient, vals) }))),
    };
  }
  // comparer i₁ et i₂ sans calcul
  function comparer() {
    const [m1, m2] = hasard([['air', 'eau'], ['air', 'verre'], ['eau', 'verre'], ['eau', 'air'], ['verre', 'air'], ['verre', 'eau'], ['air', 'plexi']]);
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
        {
          type: 'choix', q: 'Sans calcul : que fait le rayon réfracté ?',
          options: [{ id: 'r', label: 'Il se rapproche de la normale.' }, { id: 'e', label: 'Il s\'éloigne de la normale.' }, { id: 'n', label: 'Il n\'est pas dévié.' }],
          bonne: rapproche ? 'r' : 'e', melanger: false, colonne: true,
          indices: { r: pourquoi, e: pourquoi, n: `Seul un rayon qui arrive perpendiculairement à la surface (${iH(1)} = 0°) n'est pas dévié.` },
          solution: pourquoi,
        },
        {
          type: 'choix', q: `Compare ${iH(1)} et ${iH(2)}.`,
          options: [{ id: 'p', label: `${iH(2)} < ${iH(1)}` }, { id: 'g', label: `${iH(2)} > ${iH(1)}` }, { id: 'e', label: `${iH(2)} = ${iH(1)}` }],
          bonne: rapproche ? 'p' : 'g', melanger: false,
          indices: { p: pourquoi, g: pourquoi, e: 'Le rayon change de direction en changeant de milieu : les deux angles sont différents.' },
        },
      ],
    };
  }

  const GROUPES = {
    i2: calculerI2([['air', 'eau'], ['air', 'verre'], ['eau', 'verre']]),
    i1: calculerI1, indice: calculerIndice, normale: incidenceNormale, mesures, comparer,
  };
  function questionsSerie() {
    const liste = ['i2', 'i2', 'i1', 'indice', 'indice', 'normale', 'mesures', 'comparer', hasard(['i2', 'i1']), hasard(['i1', 'indice', 'comparer', 'mesures'])];
    return RF.melanger(liste).map(g => GROUPES[g]());
  }

  Object.assign(RF, { questionsSerie, GROUPES_SERIE: GROUPES });
})();
