/* ============================================================
   Schéma de la réfraction : situations, géométrie, dessin et
   manipulation guidée pas à pas (module 1 ; repris par les modules 2, 4 et 5)

   RF.SITUATIONS                       les 7 situations du module 1 (repère local, I à l'origine)
   RF.geo(sit, orient)                 géométrie dans le repère de la figure :
                                       orient = { rot: 0 à 3 (quarts de tour), miroir } ;
                                       → { I, u, N1, N2, S, R, F, arcs, ancres des milieux… }
   RF.ORIENTATIONS(sit)                orientations possibles d'une situation
   RF.dessiner(S, g, e)                dessine la figure selon l'état e (ce qui est placé)
   RF.etatComplet(g, o)                état « schéma complet » (o.anglesSurface, o.milieuxInverses : schémas faux)
   RF.figure(zone, sit, orient, o)     figure statique (schéma complet ou variante fausse) → scène
   RF.schema(fig, cmd, sit, o)         manipulation pas à pas ; o = { orient, pas (liste), surEtape(k), surFin(),
                                       anglesAPlacer: ['i1', 'i2'] } → { etapes, montrerTout() }
   RF.schemaReference(zone)            schéma de référence du module 1 (figure complète et légende)
   RF.manipSchema(zone)                page du module 1 : récapitulatif (schéma de référence), 7 situations
                                       (le prisme toujours en dernier), puis fin
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, ecart = OPT.ecart, M = RF.MILIEUX;
  const L = 165;                                   // longueur des rayons (unités de la scène, carré de 400)
  const Q = [[-200, -200], [200, -200], [200, 200], [-200, 200]];
  const nH = RF.nHTML, iH = RF.iHTML;

  /* ---------- Les 7 situations (repère local) ----------
     alpha : direction de la surface ; n2 : direction de la normale vers le milieu 2 ;
     direction de propagation incidente = n2 + sens × i1 */
  // prisme rectangle en C, d'angle A = 30° : la normale en I ne passe par aucun sommet
  const S30 = 0.5, C30 = Math.sqrt(3) / 2;
  const SITUATIONS = [
    { id: 'aquarium', titre: 'La lumière entre dans l\'eau', texte: 'Un rayon de lumière arrive sur la surface de l\'eau d\'un aquarium.',
      m1: 'air', m2: 'eau', type: 'plan', alpha: 0, n2: -90, sens: 1, i1: 30, refracte: true, reflechi: true, source: 'lampe', eau: true },
    { id: 'piece', titre: 'La pièce au fond de l\'eau', texte: 'Une pièce est au fond d\'un récipient rempli d\'eau. La lumière qui part de la pièce sort de l\'eau vers l\'œil.',
      m1: 'eau', m2: 'air', type: 'plan', alpha: 0, n2: 90, sens: -1, i1: 30, refracte: false, reflechi: false, source: 'piece', eau: true },
    { id: 'vitre', titre: 'La lumière entre dans le verre', texte: 'Un rayon de lumière arrive sur une vitre verticale.',
      m1: 'air', m2: 'verre', type: 'plan', alpha: 90, n2: 0, sens: -1, i1: 55, refracte: true, reflechi: true, source: 'lampe' },
    { id: 'sortie-verre', titre: 'La lumière sort du verre', texte: 'Un rayon de lumière qui se propage dans un bloc de verre arrive sur sa face verticale.',
      m1: 'verre', m2: 'air', type: 'plan', alpha: 90, n2: 180, sens: 1, i1: 25, refracte: false, reflechi: false, source: 'lampe' },
    { id: 'demi', titre: 'Le demi-cylindre de plexiglas', texte: 'Un rayon de lumière arrive au centre de la face plane d\'un demi-cylindre de plexiglas.',
      m1: 'air', m2: 'plexi', type: 'demi', alpha: 90, n2: 0, sens: 1, i1: 40, refracte: true, reflechi: false, source: 'lampe' },
    { id: 'normale', titre: 'Incidence normale', texte: 'Un rayon de lumière arrive perpendiculairement à la surface de l\'eau. <b>Quand un rayon arrive perpendiculairement à la surface, il n\'est pas dévié.</b>',
      m1: 'air', m2: 'eau', type: 'plan', alpha: 0, n2: -90, sens: 1, i1: 0, refracte: false, reflechi: false, source: 'lampe', eau: true },
    { id: 'prisme', titre: 'La face d\'un prisme', texte: 'Un rayon de lumière entre dans un prisme de verre, puis arrive sur sa face inclinée.',
      m1: 'verre', m2: 'air', type: 'prisme', alpha: -60, n2: 30, sens: -1, i1: 30, refracte: false, reflechi: false, source: 'lampe',
      triangle: [[-100, 100 * C30 / S30], [110 * S30, -110 * C30], [-100, -110 * C30]], entree: [-100, 0], externe: [-174, 0] },
  ];
  // orientations : rotations d'un quart de tour (et miroir) ; l'eau reste en bas (gauche ou droite seulement)
  function ORIENTATIONS(sit) {
    if (sit.eau) return [{ rot: 0, miroir: false }, { rot: 0, miroir: true }];
    return [0, 1, 2, 3].map(rot => ({ rot, miroir: false }));
  }

  /* ---------- Géométrie dans le repère de la figure ---------- */
  function geo(sit, orient) {
    orient = orient || { rot: 0, miroir: false };
    const tA = a => (orient.miroir ? 180 - a : a) + 90 * orient.rot;
    const tP = p => { let q = orient.miroir ? [-p[0], p[1]] : p.slice(); for (let k = 0; k < orient.rot; k++) q = [-q[1], q[0]]; return q; };
    // indices imposés par la situation (milieu inconnu) : sit.nM1, sit.nM2
    const m1 = Object.assign({}, M[sit.m1], sit.nM1 != null ? { n: sit.nM1 } : {});
    const m2 = Object.assign({}, M[sit.m2], sit.nM2 != null ? { n: sit.nM2 } : {}), I = [0, 0];
    const alpha = tA(sit.alpha), n2a = tA(sit.n2), dA = tA(sit.n2 + sit.sens * sit.i1);
    const u = V.dir(alpha), N2 = V.dir(n2a), N1 = V.mul(N2, -1), d = V.dir(dA);
    const g = { sit, orient, m1, m2, I, u, N1, N2, d, alpha, n2a, n1a: n2a + 180, i1: sit.i1, type: sit.type };
    if (sit.type === 'plan') {
      g.poly1 = OPT.demiPlan(Q, I, N1); g.poly2 = OPT.demiPlan(Q, I, N2);
      g.dans2 = p => V.dot(p, N2) > 0; g.dans1 = p => !g.dans2(p);
      g.surface = [V.mul(u, -205), V.mul(u, 205)];
    } else if (sit.type === 'demi') {
      g.poly1 = Q; g.poly2 = OPT.demiDisque(I, 150, n2a, 48);
      g.dans2 = p => OPT.dansPolygone(p, g.poly2); g.dans1 = p => !g.dans2(p);
      g.surface = [V.mul(u, -150), V.mul(u, 150)];
      g.bord = g.poly2;
    } else {
      const tri = sit.triangle.map(tP);
      g.poly1 = tri; g.poly2 = Q; g.bord = tri;
      g.dans1 = p => OPT.dansPolygone(p, tri); g.dans2 = p => !g.dans1(p);
      // face de sortie : du sommet A au sommet B
      g.surface = [tri[0], tri[1]];
      g.externe = [tP(sit.externe), tP(sit.entree)];
    }
    if (sit.lettres) g.lettres = sit.lettres.map(([p, t]) => [tP(p), t]);
    // rayons : incident (S → I), réfracté (I → R), réfléchi (I → F)
    g.S = sit.type === 'prisme' ? tP(sit.entree) : V.sub(I, V.mul(d, L));
    g.source = sit.type === 'prisme' ? g.externe[0] : g.S;
    const r = OPT.devier(d, N2, m1.n, m2.n);
    g.t = r.refracte; g.i2 = r.i2; g.refl = r.reflechi;
    g.aT = V.angle(g.t); g.aInc = V.angle(V.mul(d, -1)); g.aRefl = V.angle(g.refl);
    g.R = V.mul(g.t, sit.type === 'demi' ? 150 : L);
    if (sit.type === 'demi') g.Rsuite = V.mul(g.t, 196);
    g.F = V.mul(g.refl, 140);
    g.rayons = { inc: { a: g.S, b: I }, refr: { a: I, b: g.R }, refl: { a: I, b: g.F } };
    g.avecRefl = sit.reflechi;
    // arcs possibles autour de I (entre chaque rayon et la normale, entre chaque rayon et la surface)
    const cote = a => { const s = V.dot(V.dir(a), u) >= 0 ? 1 : -1; return V.angle(V.mul(u, s)); };
    g.arcs = [];
    if (sit.i1 > 0) {
      g.arcs.push({ id: 'inc-n', rayon: 'inc', type: 'normale', a1: g.aInc, a2: g.n1a, r: 50 });
      g.arcs.push({ id: 'inc-s', rayon: 'inc', type: 'surface', a1: g.aInc, a2: cote(g.aInc), r: 84 });
      g.arcs.push({ id: 'refr-n', rayon: 'refr', type: 'normale', a1: g.aT, a2: n2a, r: 50 });
      g.arcs.push({ id: 'refr-s', rayon: 'refr', type: 'surface', a1: g.aT, a2: cote(g.aT), r: 84 });
      if (sit.reflechi) g.arcs.push({ id: 'refl-n', rayon: 'refl', type: 'normale', a1: g.aRefl, a2: g.n1a, r: 50 });
      g.arcs.forEach(a => { const m = a.a1 + ecart(a.a2, a.a1) / 2; a.ancre = V.mul(V.dir(m), a.r + 17); });
    }
    // position des étiquettes des rayons : aux 3/4 du rayon, décalées sans toucher le trait
    g.posRayon = {};
    Object.keys(g.rayons).forEach(k => {
      const ry = g.rayons[k], loin = k === 'inc' ? ry.a : ry.b, dir = V.norm(V.sub(loin, I));
      const p = V.mul(loin, 0.74), n = V.perp(dir), w = 54, h = 11;
      let off = w * Math.abs(n[0]) + h * Math.abs(n[1]) + 6;
      // côté opposé à la normale (vers la surface)
      const nrm = k === 'refr' ? N2 : N1;
      const s = V.dot(n, nrm) > 0 ? -1 : 1;
      let q = V.add(p, V.mul(n, s * off));
      // reste dans le carré
      q = [Math.max(-196 + w, Math.min(196 - w, q[0])), Math.max(-190, Math.min(190, q[1]))];
      g.posRayon[k] = q;
    });
    // places des noms des milieux (loin des rayons, de la normale et des arcs)
    const obst = [g.surface, [V.mul(N1, 200), V.mul(N2, 200)], [g.S, I], [I, g.R], [I, V.mul(g.t, 200)]];
    if (sit.reflechi) obst.push([I, g.F]);
    if (g.externe) obst.push(g.externe);
    // demi-cylindre : l'étiquette peut déborder un peu du demi-disque (fond blanc)
    const souple = sit.type === 'demi';
    g.ancre1 = placer(g.dans1, obst, null, false);
    g.ancre2 = placer(g.dans2, obst, g.ancre1, souple);
    return g;
  }
  // meilleure place d'un cadre de 144 × 44 dans une région, loin des obstacles
  // (souple : seul le milieu du cadre doit être dans la région)
  function placer(dans, obst, eviter, souple) {
    const w = 72, h = 22;
    let best = null;
    for (let x = -198 + w; x <= 198 - w; x += 6) {
      for (let y = -198 + h; y <= 198 - h; y += 6) {
        const coins = [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h], [x, y]];
        const tests = souple ? [[x, y], [x - w * 0.5, y], [x + w * 0.5, y]] : coins;
        if (!tests.every(dans)) continue;
        const pts = coins.concat([[x - w, y], [x + w, y], [x, y - h], [x, y + h]]);
        let dmin = Infinity;
        pts.forEach(p => obst.forEach(s => { dmin = Math.min(dmin, OPT.distSegment(p, s[0], s[1])); }));
        // pas trop près du point I (arcs d'angle) : distance du cadre à I, moins le rayon des arcs
        const dx = Math.max(0, Math.abs(x) - w), dy = Math.max(0, Math.abs(y) - h);
        dmin = Math.min(dmin, Math.hypot(dx, dy) - 115);
        if (eviter) dmin = Math.min(dmin, Math.max(Math.abs(x - eviter[0]) - 2 * w, Math.abs(y - eviter[1]) - 2 * h));
        if (!best || dmin > best.d) best = { d: dmin, p: [x, y] };
      }
    }
    if (best) return best.p;
    // région trop étroite pour le cadre entier : seul son milieu y est
    return souple ? [0, 0] : placer(dans, obst, eviter, true);
  }

  /* ---------- Dessin ----------
     e = { pointI, normale: 'non' | 'essai' | 'oui', angleNormale, refr: 'oui' | 'non' | 'essai', angleRefr,
           etiqRayons: { inc, refr, refl }, fleches: { inc, refr, refl } (1, −1 ou 0),
           angles: { i1: id d'arc, i2: id d'arc }, arcsCibles: bool, milieux: { m1: 1 | 2, m2: 1 | 2 }, angle0 } */
  function dessiner(S, g, e) {
    ['milieux', 'deco', 'rayons', 'arcs', 'textes'].forEach(n => S.vider(n));
    const I = g.I;
    // milieux, avec leur nom
    // le milieu qui remplit tout le carré d'abord (prisme : l'air, puis le verre)
    const polys = [[g.poly1, g.m1], [g.poly2, g.m2]];
    if (g.poly2 === Q) polys.reverse();
    polys.forEach(([pl, mi]) => S.poly('milieux', pl, 'opt-milieu opt-fond-' + mi.fond));
    if (g.bord) S.poly('deco', g.bord, 'opt-bord', { fill: 'none' });
    S.ligne('deco', g.surface[0], g.surface[1], 'opt-surface');
    // source de lumière (lampe) ou pièce
    if (g.sit.source === 'piece') {
      const c = g.S;
      S.poly('deco', Array.from({ length: 18 }, (_, k) => V.add(c, [13 * Math.cos(k * Math.PI / 9), 5 * Math.sin(k * Math.PI / 9)])), 'opt-piece');
    } else {
      const c = g.source;
      S.cercle('deco', c, 8, 'opt-lampe');
      for (let k = 0; k < 8; k++) { const v = V.dir(k * 45); S.ligne('deco', V.add(c, V.mul(v, 11)), V.add(c, V.mul(v, 15)), 'opt-lampe-rayon'); }
    }
    // noms des milieux (ou étiquettes « milieu 1 : … » une fois placées)
    const m = e.milieux || {};
    [[1, g.ancre1, g.m1], [2, g.ancre2, g.m2]].forEach(([k, p, mi]) => {
      const pose = m.m1 === k ? 1 : m.m2 === k ? 2 : 0;
      if (pose) {
        const mm = pose === 1 ? g.m1 : g.m2;
        const val = pose === 2 && g.sit.cacheN2 ? '?' : RF.fmt(mm.n, 2);
        // sit.etiq1, sit.etiq2 : texte propre (schéma générique du cours)
        const propre = pose === 1 ? g.sit.etiq1 : g.sit.etiq2;
        S.etiquette('textes', p, propre || `milieu ${pose} : ${mm.court || mm.nom}<br>${nH(mm.sym)} =\u00a0${val}`);
      } else S.texte('milieux', p, mi.nom, { cls: 'opt-milieu-nom' });
    });
    // normale
    if (e.normale === 'oui') {
      S.ligne('deco', V.mul(g.N1, 196), V.mul(g.N2, 196), 'opt-normale');
      S.angleDroit('deco', I, g.n2a, g.alpha + (V.dot(V.dir(g.alpha), g.t) >= 0 ? 180 : 0), 13);
    } else if (e.normale === 'essai') {
      const v = V.dir(e.angleNormale);
      S.ligne('deco', V.mul(v, -196), V.mul(v, 196), 'opt-normale-essai');
    }
    // rayons
    const fl = e.fleches || {};
    if (g.externe) S.rayon('rayons', g.externe[0], g.externe[1], { fleche: 1, cls: 'opt-pale' });
    S.rayon('rayons', g.S, I, { fleche: fl.inc || 0 });
    if (e.refr === 'oui') {
      S.rayon('rayons', I, g.R, { fleche: fl.refr || 0 });
      if (g.Rsuite) S.rayon('rayons', g.R, g.Rsuite, { cls: 'opt-pale' });
    } else if (e.refr === 'essai') {
      S.rayon('rayons', I, V.mul(V.dir(e.angleRefr), L), { cls: 'opt-essai' });
    }
    if (g.avecRefl) S.rayon('rayons', I, g.F, { fleche: fl.refl || 0 });
    // étiquettes des rayons
    const er = e.etiqRayons || {};
    const NOMS = { inc: 'rayon incident', refr: 'rayon réfracté', refl: 'rayon réfléchi' };
    Object.keys(er).forEach(k => { if (er[k]) S.etiquette('textes', g.posRayon[k], NOMS[k]); });
    // arcs d'angle : cibles en pointillés, puis angles placés
    const an = e.angles || {};
    const places = Object.values(an);
    const visible = a => a.rayon !== 'refr' || e.refr === 'oui';
    if (e.arcsCibles) g.arcs.forEach(a => {
      if (places.includes(a.id) || !visible(a)) return;
      S.arc('arcs', I, a.a1, a.a2, a.r, 'opt-arc-cible');
      S.cercle('arcs', a.ancre, 9, 'opt-ancre');
    });
    Object.keys(an).forEach(k => {
      const a = g.arcs.find(x => x.id === an[k]);
      if (!a) return;
      S.arc('arcs', I, a.a1, a.a2, a.r, 'opt-arc-pose');
      S.etiquette('textes', a.ancre, iH(k[1]) + (e.valeurs && e.valeurs[k] ? ' =\u00a0' + e.valeurs[k] : ''), { taille: 14 });
    });
    if (e.angle0) S.etiquette('textes', V.add(V.mul(g.N1, 60), V.mul(g.u, 42)), e.angle0 === 'i1' ? `${iH(1)} = 0°` : `${iH(1)} = ${iH(2)} = 0°`);
    // prisme : le rayon arrive perpendiculairement à la face d'entrée (angle droit)
    if (e.entreeDroit && g.externe) {
      const dE = V.norm(V.sub(g.externe[1], g.externe[0]));
      S.angleDroit('deco', g.externe[1], V.angle(dE), V.angle(V.perp(dE)), 12);
    }
    // schéma de référence : noms de la normale et de la surface
    if (e.legendes) {
      S.etiquette('textes', V.mul(g.N2, 178), 'normale', { cls: 'opt-neutre' });
      S.etiquette('textes', V.add(V.mul(g.u, -128), V.mul(g.N2, 14)), 'surface de séparation', { cls: 'opt-neutre', taille: 12 });
    }
    // point d'incidence
    if (e.pointI) {
      S.cercle('textes', I, 4, 'opt-point');
      // lettre I dans le quart sans rayon : côté du milieu 2, du côté de la source le long de la surface
      const sInc = V.dot(V.sub(g.S, I), g.u) >= 0 ? 1 : -1;
      S.texte('textes', V.add(V.mul(g.u, 30 * sInc), V.mul(g.N2, 13)), `<b>${g.sit.nomPoint || 'I'}</b>`, { taille: 16 });
    }
    // lettres des sommets et des points (prisme)
    (g.lettres || []).forEach(([p, t]) => S.texte('textes', p, `<b>${t}</b>`, { taille: 15 }));
    if (e.extra) e.extra(S, g);
  }

  // état « schéma complet » ; o.anglesSurface, o.milieuxInverses : variantes fausses (série du module 4)
  function etatComplet(g, o) {
    o = o || {};
    const e = { pointI: true, normale: 'oui', refr: 'oui', etiqRayons: { inc: true, refr: true }, fleches: { inc: 1, refr: 1 },
      angles: {}, milieux: { m1: 1, m2: 2 }, valeurs: o.valeurs };
    if (g.avecRefl) { e.etiqRayons.refl = true; e.fleches.refl = 1; }
    if (g.i1 > 0) e.angles = o.anglesSurface ? { i1: 'inc-s', i2: 'refr-s' } : { i1: 'inc-n', i2: 'refr-n' };
    else e.angle0 = true;
    if (o.milieuxInverses) e.milieux = { m1: 2, m2: 1 };
    if (o.sansEtiquettes) { e.etiqRayons = {}; }
    if (o.legendes) e.legendes = true;
    return e;
  }
  function figure(zone, sit, orient, o) {
    const g = geo(sit, orient);
    const S = OPT.scene(zone, { aria: (o && o.aria) || 'Schéma de la réfraction : ' + sit.titre });
    const e = etatComplet(g, o);
    dessiner(S, g, e);
    // l'étiquette a besoin des dimensions du texte : on redessine une fois la figure affichée
    requestAnimationFrame(() => dessiner(S, g, e));
    return { S, g };
  }

  /* ============================================================
     MANIPULATION PAS À PAS
     fig : conteneur de la figure ; cmd : conteneur des consignes, commandes et retours
     ============================================================ */
  const TEXTES_PAS = {
    entree: 'Pourquoi le rayon n\'est-il pas dévié en <b>entrant</b> dans le prisme ?',
    I: 'Touche le <b>point d\'incidence I</b>.',
    normale: 'Trace la <b>normale</b> en I.',
    normaleJ: 'Trace la <b>normale</b> en J, sur la face AB.',
    anglesI1: 'Place l\'angle d\'incidence <b>i<sub>1</sub></b> en J.',
    tracer: 'Trace l\'<b>allure du rayon réfracté</b>.',
    rayons: 'Nomme les <b>rayons</b>.',
    fleches: 'Place la <b>flèche</b> de chaque rayon, dans le sens de la lumière.',
    angles: 'Place l\'angle d\'incidence <b>i<sub>1</sub></b> et l\'angle de réfraction <b>i<sub>2</sub></b>.',
    angle0: 'Donne l\'angle d\'incidence <b>i<sub>1</sub></b>.',
    angle0i2: 'Donne l\'angle de réfraction <b>i<sub>2</sub></b>.',
    milieux: 'Place le <b>milieu 1</b> et le <b>milieu 2</b>.',
  };
  function listePas(sit, pas) {
    // prisme : d'abord, pourquoi le rayon n'est pas dévié à l'entrée
    const l = sit.type === 'prisme' && !pas ? ['entree', 'I', 'normale'] : ['I', 'normale'];
    if (!sit.refracte) l.push('tracer');
    l.push('rayons', 'fleches');
    if (sit.i1 > 0) l.push('angles'); else l.push('angle0', 'angle0i2');
    l.push('milieux');
    return pas ? l.filter(p => pas.includes(p) || ((p === 'angle0' || p === 'angle0i2') && pas.includes('angles'))) : l;
  }

  // texte d'un pas (le prisme du module 5 : point J, un seul angle)
  function textePas(p, sit, o) {
    if (p === 'normale' && sit.nomPoint === 'J') return TEXTES_PAS.normaleJ;
    if (p === 'angles' && o && o.anglesAPlacer && o.anglesAPlacer.length === 1) return TEXTES_PAS.anglesI1;
    return TEXTES_PAS[p];
  }
  function schema(fig, cmd, sit, o) {
    o = o || {};
    const texte = p => textePas(p, sit, o);
    const g = geo(sit, o.orient);
    const S = OPT.scene(fig, { aria: 'Schéma à compléter : ' + sit.titre });
    const pas = listePas(sit, o.pas);
    // état : ce qui n'est pas à placer par l'élève est déjà en place
    const e = { pointI: !pas.includes('I'), normale: pas.includes('normale') ? 'non' : 'oui', refr: o.sansRefracte ? 'non' : sit.refracte || !pas.includes('tracer') ? 'oui' : 'non',
      etiqRayons: {}, fleches: {}, angles: {}, milieux: {} };
    if (!pas.includes('rayons')) { e.etiqRayons = o.etiqRayons || {}; }
    if (!pas.includes('fleches')) { e.fleches = { inc: 1, refr: 1, refl: 1 }; }
    if (!pas.includes('milieux') && o.milieuxPlaces !== false) e.milieux = { m1: 1, m2: 2 };
    const redessiner = () => dessiner(S, g, e);
    redessiner();
    requestAnimationFrame(redessiner);
    S.surRedim(redessiner);

    cmd.innerHTML = `<div class="rf-consigne" aria-live="polite"></div><div class="rf-cmd"></div>
      <div class="rf-retour" aria-live="polite"></div><div class="rf-aide" hidden><button type="button" class="btn-small">Afficher la réponse</button></div>`;
    const $c = cmd.querySelector('.rf-consigne'), $cmd = cmd.querySelector('.rf-cmd'), $ret = cmd.querySelector('.rf-retour'), $aide = cmd.querySelector('.rf-aide');
    let k = -1, erreurs = 0, courant = null, fini = false;

    function ok(h) { $ret.innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">${erreurs ? 'C\'est juste.' : 'Juste !'}</b> ${h || ''}</p></div>`; }
    function erreur(h) {
      erreurs++;
      $ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h}</p>${erreurs >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p>' : ''}</div>`;
      if (erreurs >= 2) $aide.hidden = false;
      RF.defiler($ret);
    }
    function message(h) { $ret.innerHTML = `<p class="ph-msg">${h}</p>`; }
    function suivant(h, vue) {
      if (courant && courant.quitter) courant.quitter();
      $cmd.innerHTML = ''; $aide.hidden = true;
      if (vue) $ret.innerHTML = `<div class="callout er-retour"><p><b>Réponse.</b> ${h || ''}</p></div>`;
      else ok(h);
      redessiner();
      entrer(k + 1);
    }
    $aide.querySelector('button').onclick = () => { if (courant && courant.montrer) { courant.montrer(); } };

    function entrer(n) {
      k = n; erreurs = 0;
      if (o.surEtape) o.surEtape(k, pas[k]);
      if (k >= pas.length) {
        fini = true;
        $c.innerHTML = '';
        if (o.surFin) o.surFin();
        return;
      }
      $c.innerHTML = `<p>${texte(pas[k])}</p>`;
      courant = PAS[pas[k]]();
      redessiner();
    }

    // incidence normale : i₁ = 0° (k = '1'), puis i₂ = 0° (k = '2')
    function choixAngle(k) {
      $cmd.innerHTML = `<div class="ph-choix"><button type="button" class="btn-secondary" data-r="0">${iH(k)} = 0°</button><button type="button" class="btn-secondary" data-r="90">${iH(k)} = 90°</button></div>`;
      const fin = k === '1' ? `Le rayon incident est confondu avec la normale : ${iH(1)} = 0°.`
        : `Le rayon n'est pas dévié : le rayon réfracté est aussi confondu avec la normale, ${iH(2)} = 0°.`;
      const diag = k === '1' ? 'Les angles se mesurent depuis la normale, pas depuis la surface : ici, le rayon incident est confondu avec la normale.'
        : 'Les angles se mesurent depuis la normale, pas depuis la surface : le rayon n\'est pas dévié, le rayon réfracté est confondu avec la normale.';
      const reussir = vue => { e.angle0 = k === '1' ? 'i1' : 'i1i2'; suivant(fin, vue); };
      $cmd.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
          if (b.dataset.r === '0') reussir();
          else { b.classList.add('faux'); b.disabled = true; erreur(diag); }
        };
      });
      return { montrer: () => reussir(true) };
    }

    /* ----- Les pas ----- */
    const PAS = {
      // 1. toucher le point d'incidence
      I() {
        $c.innerHTML += '<p class="rf-aide-t">Touche la figure à l\'endroit du point I.</p>';
        const cib = OPT.cible(S, g.I, () => { e.pointI = true; cib.retirer(); S.svg.removeEventListener('click', ailleurs); suivant('I est le point où le rayon incident rencontre la surface de séparation.'); });
        function ailleurs(ev) { if (ev.target === cib.el) return; erreur('I est le point où le rayon rencontre la surface de séparation.'); }
        S.svg.addEventListener('click', ailleurs);
        return {
          montrer() { e.pointI = true; cib.retirer(); S.svg.removeEventListener('click', ailleurs); suivant('I est le point où le rayon incident rencontre la surface de séparation.', true); },
          quitter() { cib.retirer(); S.svg.removeEventListener('click', ailleurs); },
        };
      },
      // 2. tracer la normale (trait qui pivote autour de I)
      normale() {
        e.normale = 'essai';
        e.angleNormale = g.alpha + (Math.random() < 0.5 ? 40 : 140);
        $cmd.innerHTML = `<p class="rf-aide-t">Fais tourner le trait pointillé : glisse sa poignée, ou utilise ◀ ▶ (1° par appui).</p>
          <p class="rf-val">Angle avec la surface : <b data-a="v"></b></p><div class="rf-ligne-cmd"></div>
          <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider la normale</button></div>`;
        const vAff = $cmd.querySelector('[data-a="v"]');
        const avecSurface = a => { let x = Math.abs(ecart(a, g.alpha)) % 180; if (x > 90) x = 180 - x; return x; };
        const maj = a => { e.angleNormale = a; vAff.textContent = Math.round(avecSurface(a)) + '°'; redessiner(); };
        const pv = OPT.pivot(S, { centre: g.I, angle: e.angleNormale, rayon: 150, pas: 1, surChange: maj, aria: 'Poignée de la normale' });
        OPT.fleches($cmd.querySelector('.rf-ligne-cmd'), { moins: () => pv.regler(pv.angle() - 1), plus: () => pv.regler(pv.angle() + 1), aria: ['Tourner de 1° dans un sens', 'Tourner de 1° dans l\'autre sens'] });
        maj(e.angleNormale);
        const reussir = vue => { pv.el.remove(); e.normale = 'oui'; suivant('La normale est la droite perpendiculaire à la surface en I : elle fait un angle droit avec la surface.', vue); };
        $cmd.querySelector('[data-a="ok"]').onclick = () => {
          const x = avecSurface(pv.angle());
          if (Math.abs(90 - x) <= 3) reussir();
          else if (x <= 15) erreur('Ce trait suit la surface ; la normale est perpendiculaire à la surface en I.');
          else erreur(`Ce trait fait un angle de ${Math.round(x)}° avec la surface : la normale est perpendiculaire à la surface (angle droit, 90°).`);
        };
        return { montrer: () => reussir(true), quitter() { pv.el.remove(); } };
      },
      // 3. tracer l'allure du rayon réfracté (situations où il n'est pas dessiné) : on vérifie seulement
      //    qu'il est du bon côté de la normale ; sa direction exacte est ensuite tracée
      tracer() {
        e.refr = 'essai';
        const signe = sit.i1 > 0 ? Math.sign(ecart(g.aT, g.n2a)) : 1;
        e.angleRefr = sit.i1 > 0 ? g.n2a : g.n2a + (Math.random() < 0.5 ? 30 : -30);
        $cmd.innerHTML = `<p class="rf-aide-t">Glisse l'extrémité du rayon pointillé, ou utilise ◀ ▶. ${sit.i1 > 0 ? 'Place-le du bon côté de la normale : sa direction exacte sera tracée ensuite.' : ''}</p>
          <div class="rf-ligne-cmd"></div><div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider le rayon</button></div>`;
        const pv = OPT.pivot(S, {
          centre: g.I, angle: e.angleRefr, rayon: L, pas: 1,
          contraindre: a => g.n2a + Math.max(-86, Math.min(86, ecart(a, g.n2a))),
          surChange: a => { e.angleRefr = a; redessiner(); }, aria: 'Extrémité du rayon réfracté',
        });
        OPT.fleches($cmd.querySelector('.rf-ligne-cmd'), { moins: () => pv.regler(pv.angle() - 1), plus: () => pv.regler(pv.angle() + 1), aria: ['Tourner de 1° dans un sens', 'Tourner de 1° dans l\'autre sens'] });
        const texteFin = () => sit.i1 > 0
          ? 'Le rayon réfracté traverse la surface : il est dans l\'autre milieu, de l\'autre côté de la normale. Sa direction exacte est maintenant tracée.'
          : 'Le rayon arrive perpendiculairement à la surface : il n\'est pas dévié, il continue tout droit.';
        const reussir = vue => { pv.el.remove(); e.refr = 'oui'; suivant(texteFin(), vue); };
        $cmd.querySelector('[data-a="ok"]').onclick = () => {
          const th = ecart(pv.angle(), g.n2a), a = Math.abs(th);
          if (sit.i1 === 0) { if (a <= 3) reussir(); else erreur('Le rayon arrive perpendiculairement à la surface : il n\'est pas dévié, il continue tout droit, le long de la normale.'); return; }
          if (a < 2) { erreur('Ton rayon suit la normale : seul un rayon qui arrive perpendiculairement à la surface n\'est pas dévié.'); return; }
          if (Math.sign(th) !== signe) { erreur('Le rayon réfracté traverse la surface et passe de l\'autre côté de la normale.'); return; }
          reussir();
        };
        return { montrer: () => reussir(true), quitter() { pv.el.remove(); } };
      },
      // 4. nommer les rayons (étiquettes à déposer)
      rayons() {
        const ids = ['inc', 'refr'].concat(g.avecRefl ? ['refl'] : []);
        const NOMS = { inc: 'rayon incident', refr: 'rayon réfracté', refl: 'rayon réfléchi' };
        const src = sit.source === 'piece' ? 'de la pièce' : 'de la lampe';
        const DIAG = {
          inc: `Le rayon incident arrive sur la surface : il vient ${src}.`,
          refr: 'Le rayon réfracté traverse la surface : il est dans l\'autre milieu.',
          refl: 'Le rayon réfléchi repart de I dans le même milieu que le rayon incident : la surface fait miroir.',
        };
        $cmd.innerHTML = '<p class="rf-aide-t">Glisse chaque étiquette sur son rayon, ou touche une étiquette puis touche le rayon.</p><div class="rf-bac"></div>';
        let restants = ids.length;
        const et = OPT.etiquettes(S, $cmd.querySelector('.rf-bac'), {
          items: RF.melanger(ids).map(id => ({ id, html: NOMS[id] })),
          cibles: () => ids.map(id => ({ id, a: g.rayons[id].a, b: g.rayons[id].b })),
          surDepot(id, c) {
            if (c.id !== id) { erreur(DIAG[id]); return false; }
            e.etiqRayons[id] = true; redessiner(); $ret.innerHTML = '<p class="ph-ok">✓ ' + NOMS[id] + '</p>';
            if (--restants === 0) suivant('Le rayon incident arrive sur la surface, le rayon réfracté traverse la surface' + (g.avecRefl ? ', le rayon réfléchi reste dans le premier milieu.' : '.'));
            return true;
          },
        });
        return {
          montrer() { ids.forEach(id => { e.etiqRayons[id] = true; }); et.vider(); suivant('Le rayon incident arrive sur la surface, le rayon réfracté traverse la surface' + (g.avecRefl ? ', le rayon réfléchi reste dans le premier milieu.' : '.'), true); },
          quitter() { et.vider(); },
        };
      },
      // 5. placer les flèches (toucher un rayon : la flèche apparaît, un nouvel appui la retourne)
      fleches() {
        const ids = ['inc', 'refr'].concat(g.avecRefl ? ['refl'] : []);
        $cmd.innerHTML = `<p class="rf-aide-t">Touche un rayon : sa flèche apparaît ; touche-le encore pour la retourner.</p>
          <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider les flèches</button></div>`;
        let actif = true;
        function toucher(ev) {
          if (!actif) return;
          const c = S.plusProche(ev, ids.map(id => ({ id, a: g.rayons[id].a, b: g.rayons[id].b })), 30);
          if (!c) return;
          e.fleches[c.id] = e.fleches[c.id] ? -e.fleches[c.id] : (Math.random() < 0.5 ? 1 : -1);
          $ret.innerHTML = '';
          redessiner();
        }
        OPT.surAppui(S.svg, toucher);
        const reussir = vue => { actif = false; ids.forEach(id => { e.fleches[id] = 1; }); suivant('Sur chaque rayon, la flèche indique le sens de propagation de la lumière, toujours vers l\'œil.', vue); };
        $cmd.querySelector('[data-a="ok"]').onclick = () => {
          if (ids.some(id => !e.fleches[id])) { message('Place une flèche sur chaque rayon.'); return; }
          if (e.fleches.inc !== 1) { erreur('La lumière va de la source vers I : sur le rayon incident, la flèche va vers I.'); return; }
          if (e.fleches.refr !== 1) { erreur('Après I, la lumière continue dans l\'autre milieu : sur le rayon réfracté, la flèche s\'éloigne de I.'); return; }
          if (g.avecRefl && e.fleches.refl !== 1) { erreur('Le rayon réfléchi repart de I : sa flèche s\'éloigne de I.'); return; }
          reussir();
        };
        return { montrer: () => reussir(true), quitter() { actif = false; } };
      },
      // 6. placer i1 et i2 sur les arcs
      angles() {
        const ids = o.anglesAPlacer || ['i1', 'i2'];
        e.arcsCibles = true;
        $cmd.innerHTML = '<p class="rf-aide-t">Les arcs en pointillés sont les angles possibles autour de I. Glisse chaque étiquette sur un arc, ou touche une étiquette puis touche l\'arc.</p><div class="rf-bac"></div>';
        const BON = { i1: 'inc-n', i2: 'refr-n' };
        let restants = ids.length;
        const fin = () => `${iH(1)} (angle d'incidence) est entre la normale et le rayon incident${ids.includes('i2') ? `, ${iH(2)} (angle de réfraction) entre la normale et le rayon réfracté` : ''}.`;
        const et = OPT.etiquettes(S, $cmd.querySelector('.rf-bac'), {
          items: ids.map(id => ({ id, html: `${iH(id[1])} : angle ${id === 'i1' ? 'd\'incidence' : 'de réfraction'}` })),
          cibles: () => g.arcs.filter(a => !Object.values(e.angles).includes(a.id) && (a.rayon !== 'refr' || e.refr === 'oui')).map(a => ({ id: a.id, p: a.ancre })),
          seuilPx: 30,
          surDepot(id, c) {
            const a = g.arcs.find(x => x.id === c.id);
            if (c.id === BON[id]) {
              e.angles[id] = c.id; redessiner();
              $ret.innerHTML = '';                 // la dernière manipulation est juste : on efface l'erreur
              if (--restants === 0) { e.arcsCibles = false; suivant(fin()); }
              return true;
            }
            if (a.type === 'surface') erreur('Les angles se mesurent depuis la normale, pas depuis la surface.');
            else if (a.rayon === 'refl') erreur('Cet angle est l\'angle de réflexion, entre la normale et le rayon réfléchi.' + (id === 'i2' ? ` ${iH(2)} (angle de réfraction) est entre la normale et le rayon réfracté.` : ` ${iH(1)} (angle d'incidence) est entre la normale et le rayon incident.`));
            else if (id === 'i1') erreur(`${iH(1)} est l'angle d'incidence : entre la normale et le rayon incident.`);
            else erreur(`${iH(2)} est l'angle de réfraction : entre la normale et le rayon réfracté.`);
            return false;
          },
        });
        return {
          montrer() { ids.forEach(id => { e.angles[id] = BON[id]; }); e.arcsCibles = false; et.vider(); suivant(fin(), true); },
          quitter() { et.vider(); e.arcsCibles = false; },
        };
      },
      // 6 bis. incidence normale : l'angle d'incidence vaut 0°, puis l'angle de réfraction aussi
      angle0() { return choixAngle('1'); },
      angle0i2() { return choixAngle('2'); },
      // 0. prisme : pourquoi le rayon n'est pas dévié à l'entrée
      entree() {
        $cmd.innerHTML = `<div class="ph-choix ph-choix-col">
          <button type="button" class="btn-secondary" data-r="perp">Il arrive perpendiculairement à la face d'entrée.</button>
          <button type="button" class="btn-secondary" data-r="verre">Le verre ne dévie jamais la lumière.</button>
          <button type="button" class="btn-secondary" data-r="milieu">Il arrive au milieu de la face d'entrée.</button></div>`;
        const DIAG = {
          verre: 'Sur la face inclinée, à la sortie, le rayon est dévié : le verre peut dévier la lumière. Regarde l\'angle entre le rayon et la face d\'entrée.',
          milieu: 'L\'endroit où il arrive ne compte pas : regarde l\'angle entre le rayon et la face d\'entrée.',
        };
        const fin = 'Le rayon arrive perpendiculairement à la face d\'entrée : il n\'est pas dévié. Il est dévié en sortant, sur la face inclinée.';
        const reussir = vue => { e.entreeDroit = true; suivant(fin, vue); };
        $cmd.querySelectorAll('button').forEach(b => {
          b.onclick = () => {
            if (b.dataset.r === 'perp') reussir();
            else { b.classList.add('faux'); b.disabled = true; erreur(DIAG[b.dataset.r]); }
          };
        });
        return { montrer: () => reussir(true) };
      },
      // 7. placer les milieux
      milieux() {
        const lib = mm => `${mm.nom} (${nH(mm.sym)} = ${RF.fmt(mm.n, 2)})`;
        $cmd.innerHTML = '<p class="rf-aide-t">Glisse chaque étiquette dans son milieu, ou touche une étiquette puis touche le milieu.</p><div class="rf-bac"></div>';
        let restants = 2;
        const fin = 'Le milieu 1 contient le rayon incident ; le milieu 2 contient le rayon réfracté.';
        const et = OPT.etiquettes(S, $cmd.querySelector('.rf-bac'), {
          items: [{ id: 'm1', html: 'milieu 1 : ' + lib(g.m1) }, { id: 'm2', html: 'milieu 2 : ' + lib(g.m2) }],
          cibles: () => [{ id: 1, zone: g.dans1 }, { id: 2, zone: g.dans2 }],
          surDepot(id, c) {
            const k = id === 'm1' ? 1 : 2;
            if (c.id !== k) { erreur(k === 1 ? 'Le milieu 1 est celui qui contient le rayon incident.' : 'Le milieu 2 est celui qui contient le rayon réfracté.'); return false; }
            e.milieux[id] = k; redessiner();
            $ret.innerHTML = '';
            if (--restants === 0) suivant(fin);
            return true;
          },
        });
        return { montrer() { e.milieux = { m1: 1, m2: 2 }; et.vider(); suivant(fin, true); }, quitter() { et.vider(); } };
      },
    };

    const obj = {
      S, g, e, pas, fini: () => fini, redessiner, etape: () => pas[k],
      // tout placer d'un coup (bilan)
      montrerTout() { Object.assign(e, etatComplet(g)); redessiner(); },
    };
    RF.schemaEnCours = obj;                 // schéma en cours (utile pour vérifier l'application)
    entrer(0);
    return obj;
  }

  /* ============================================================
     SCHÉMA DE RÉFÉRENCE (récapitulatif du module 1, bouton d'aide)
     ============================================================ */
  function schemaReference(zone) {
    zone.innerHTML = `<div class="rf-ref"><div class="rf-ref-fig"></div>
      <ul class="rf-legende">
        <li><b>I</b> : point d'incidence, là où le rayon incident rencontre la surface de séparation.</li>
        <li><b>Normale</b> : droite perpendiculaire à la surface de séparation en I.</li>
        <li><b>${iH(1)} : angle d'incidence</b>, entre la normale et le rayon incident.</li>
        <li><b>${iH(2)} : angle de réfraction</b>, entre la normale et le rayon réfracté.</li>
        <li><b>Milieu 1</b> : celui du rayon incident ; <b>milieu 2</b> : celui du rayon réfracté.</li>
        <li><b>Flèches</b> : sens de propagation de la lumière.</li>
        <li>Un rayon qui arrive <b>perpendiculairement</b> à la surface n'est pas dévié.</li>
      </ul></div>`;
    return figure(zone.querySelector('.rf-ref-fig'), SITUATIONS[0], null, { legendes: true, aria: 'Schéma de référence : réfraction de l\'air vers l\'eau, avec tous ses éléments' });
  }
  // bâton plongé dans l'eau : il paraît brisé à la surface
  function figBaton(zone) {
    const S = OPT.scene(zone, { largeur: 400, hauteur: 230, aria: 'Bâton plongé dans l\'eau : il paraît brisé à la surface' });
    S.poly('milieux', [[-200, 10], [200, 10], [200, -115], [-200, -115]], 'opt-milieu opt-fond-papier');
    S.ligne('deco', [-200, 10], [200, 10], 'opt-surface');
    S.texte('milieux', [150, 90], 'air', { cls: 'opt-milieu-nom' });
    S.texte('milieux', [-150, -90], 'eau', { cls: 'opt-milieu-nom' });
    // partie hors de l'eau, partie dans l'eau telle qu'on la voit (relevée), position réelle (pointillés)
    S.ligne('deco', [-150, 100], [-20, 10], 'rf-baton');
    S.ligne('deco', [-20, 10], [110, -80], 'rf-baton-reel');
    S.ligne('deco', [-20, 10], [115, -42], 'rf-baton');
    S.texte('textes', [120, -36], 'ce qu\'on voit', { ancre: 'start', taille: 12 });
    S.texte('textes', [96, -98], 'position réelle', { ancre: 'end', taille: 12, cls: 'rf-g-txt' });
    return S;
  }

  /* ============================================================
     PAGE DU MODULE 1 : récapitulatif (schéma de référence), 7 situations
     (le prisme toujours en dernier), puis fin
     ============================================================ */
  function manipSchema(zone) {
    let ordre = SITUATIONS.map(s => ({ sit: s, orient: { rot: 0, miroir: false } })), num = 0;
    // fenêtre « Schéma de référence » (toujours disponible pendant les situations)
    const aideRef = z => RF.boutonAide(z, '📖 Schéma de référence', 'Schéma de référence', corps => schemaReference(corps));
    function intro() {
      zone.innerHTML = '';
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">RÉCAPITULATIF</span>
        <div class="rf-intro">
          <div class="rf-intro-t">
            <p>Dans un milieu transparent, la lumière se propage en ligne droite. Quand elle passe d'un milieu transparent à un autre (de l'air à l'eau, de l'air au verre…), elle <b>change de direction</b> à la surface de séparation : c'est la <b>réfraction</b>.</p>
            <p>Exemple : un bâton plongé dans l'eau paraît <b>brisé</b> à la surface de l'eau.</p>
          </div>
          <div class="rf-intro-fig"></div>
        </div>
        <div class="callout-accent rf-but"><p><b>Le but du module :</b> reproduire ce schéma de référence dans <b>7 situations</b> différentes. Pendant les situations, le bouton « 📖 Schéma de référence » le réaffiche.</p></div>
        <div data-a="ref"></div>
        <div class="er-actions"><button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      zone.appendChild(carte);
      figBaton(carte.querySelector('.rf-intro-fig'));
      schemaReference(carte.querySelector('[data-a="ref"]'));
      carte.querySelector('[data-a="go"]').onclick = () => { num = 0; afficher(); };
      window.scrollTo(0, 0);
    }
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      if (num < ordre.length) situation(ordre[num], num + 1);
      else fin();
    }
    // la figure à gauche ; à droite, la liste des étapes puis la question en cours (pas besoin de défiler sur ordinateur)
    function situation(item, n) {
      const sit = item.sit, pas = listePas(sit);
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<div class="rf-sit-tete"><h3 class="rf-sit-titre">${sit.titre}</h3><span class="rf-sit-num">Situation ${n} / ${ordre.length}</span></div>
        <div class="rf-manip rf-manip-1">
          <div class="rf-manip-fig"><p class="rf-fig-t">${sit.texte}</p><div class="rf-fig"></div></div>
          <div class="rf-manip-panneau"><ol class="rf-deroule rf-deroule-court">${pas.map(p => `<li><span>${textePas(p, sit)}</span></li>`).join('')}</ol>
            <div class="rf-cmd-zone"></div><div data-a="suite"></div><div class="rf-aide-ref"></div></div>
        </div>`;
      zone.appendChild(carte);
      aideRef(carte.querySelector('.rf-aide-ref'));
      const lis = carte.querySelectorAll('.rf-deroule li');
      schema(carte.querySelector('.rf-fig'), carte.querySelector('.rf-cmd-zone'), sit, {
        orient: item.orient,
        surEtape(k) {
          lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); });
          if (k > 0) RF.amener(carte.querySelector(RF.surOrdi() ? '.rf-manip' : '.rf-manip-fig'), 0.35);
        },
        surFin() {
          const s = carte.querySelector('[data-a="suite"]');
          s.innerHTML = `<div class="callout-accent rf-complet"><p><b>Schéma complet.</b> Normale, rayons et leurs flèches, angle d'incidence ${iH(1)} et angle de réfraction ${iH(2)}, milieux 1 et 2.</p></div>
            <div class="er-actions"><button type="button" class="btn-primary">${n < ordre.length ? 'Situation suivante →' : 'Terminer →'}</button></div>`;
          s.querySelector('button').onclick = () => { num++; afficher(); };
          RF.defiler(s);
        },
      });
    }
    function fin() {
      SOM.marquer({ fait: true });
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">TERMINÉ</span>
        <p class="er-contexte">Tu as reproduit le schéma de référence dans les 7 situations. Recommence : les situations seront dans un autre ordre et tournées.</p>
        <div class="er-actions">
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-secondary" data-a="ref">Revoir le récapitulatif</button>
          <a class="btn-primary" style="text-decoration:none" href="module_2_simulation.html">Module 2 : le simulateur →</a>
        </div>`;
      zone.appendChild(carte);
      carte.querySelector('[data-a="re"]').onclick = () => {
        // passages suivants : ordre et orientations au hasard, le prisme toujours en dernier
        const prisme = SITUATIONS.find(s => s.type === 'prisme');
        ordre = RF.melanger(SITUATIONS.filter(s => s !== prisme)).concat([prisme]).map(s => ({ sit: s, orient: RF.hasard(ORIENTATIONS(s)) }));
        num = 0; afficher();
      };
      carte.querySelector('[data-a="ref"]').onclick = intro;
    }
    intro();
  }

  Object.assign(RF, { SITUATIONS, ORIENTATIONS, geo, dessiner, etatComplet, figure, schema, listePas, textePas, schemaReference, manipSchema });
})();
