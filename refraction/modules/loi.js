/* ============================================================
   Module 2 : écrire la loi de Descartes (manipulation guidée)
   RF.DONNEES_LOI       données de calcul des 7 situations du module 1
   RF.sitCalcul(c)      situation du module 1 redessinée avec les angles du calcul
   RF.manipLoi(zone)    7 situations : schéma complet, puis la loi avec les étiquettes,
                        l'expression littérale, la valeur du sinus et l'angle (ou l'indice)
   ============================================================ */
(function () {
  'use strict';

  const nH = RF.nHTML, iH = RF.iHTML, fmt = RF.fmt;
  const sit = id => RF.SITUATIONS.find(s => s.id === id);

  /* ---------- Données de calcul (une par situation du module 1) ----------
     dec : décimales des angles donnés ; csAngle : chiffres significatifs du résultat */
  const DONNEES_LOI = [
    { sit: 'aquarium', m1: 'air', m2: 'eau', i1: 30, dec: 1, inconnue: 's2', csAngle: 3 },
    { sit: 'piece', m1: 'eau', m2: 'air', i2: 35, dec: 1, inconnue: 's1', csAngle: 3 },
    { sit: 'vitre', m1: 'air', m2: 'verre', i1: 55, dec: 0, inconnue: 's2', csAngle: 2 },
    { sit: 'sortie-verre', m1: 'verre', m2: 'air', i1: 25, dec: 1, inconnue: 's2', csAngle: 3 },
    { sit: 'demi', m1: 'air', m2: 'plexi', i1: 60, i2: 35.1, dec: 1, inconnue: 'n2' },
    { sit: 'normale', m1: 'air', m2: 'eau', i1: 0, dec: 0, inconnue: 's2', csAngle: 1 },
    { sit: 'prisme', m1: 'verre', m2: 'air', i1: 35, dec: 1, inconnue: 's2', csAngle: 3 },
  ];

  // angle d'incidence réel du calcul (pour dessiner la figure avec les bonnes valeurs)
  function i1De(c) {
    const n1 = RF.MILIEUX[c.m1].n, n2 = RF.MILIEUX[c.m2].n;
    if (c.inconnue === 's1') return RF.asinD(n2 * RF.sinD(c.i2) / n1);
    return c.i1;
  }
  // copie de la situation du module 1 avec l'angle d'incidence du calcul
  function sitCalcul(c, base) {
    const s = Object.assign({}, base || sit(c.sit), { i1: i1De(c), m1: c.m1, m2: c.m2 });
    if (c.n2 != null) s.nM2 = c.n2;
    if (c.inconnue === 'n2') s.cacheN2 = true;        // l'indice cherché n'est pas écrit sur la figure
    return s;
  }
  // texte d'un angle donné : 30,0° ; 55°
  const angle = (a, dec) => fmt(a, dec) + '°';
  // valeurs écrites sur la figure : l'angle donné, et « ? » pour celui qu'on cherche
  function valeurs(c) {
    if (c.inconnue === 's2') return { i1: angle(c.i1, c.dec), i2: '?' };
    if (c.inconnue === 's1') return { i1: '?', i2: angle(c.i2, c.dec) };
    return { i1: angle(c.i1, c.dec), i2: angle(c.i2, c.dec) };
  }
  // données écrites à côté de la figure
  function donnees(c) {
    const m1 = RF.MILIEUX[c.m1], m2 = RF.MILIEUX[c.m2];
    const ind = c.inconnue === 'n2' ? [m1] : [m1, m2];
    const ang = c.inconnue === 's1' ? [`${iH(2)} = ${angle(c.i2, c.dec)}`] : [`${iH(1)} = ${angle(c.i1, c.dec)}`].concat(c.inconnue === 'n2' ? [`${iH(2)} = ${angle(c.i2, c.dec)}`] : []);
    const cherche = { s2: `l'angle de réfraction ${iH(2)}`, s1: `l'angle d'incidence ${iH(1)}`, n2: `l'indice ${nH(m2.sym)} du ${m2.nom}` }[c.inconnue];
    return `<p><b>Données :</b> ${ind.map(m => `${nH(m.sym)} = ${fmt(m.n, 2)}`).join(' ; ')} ; ${ang.join(' ; ')}.</p><p><b>On cherche</b> ${cherche}.</p>`;
  }

  function manipLoi(zone) {
    let ordre = DONNEES_LOI.slice(), num = 0;
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      if (num < ordre.length) situation(ordre[num], num + 1);
      else bilan();
    }
    function situation(c, n) {
      const s = sitCalcul(c);
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<div class="rf-sit-tete"><h3 class="rf-sit-titre">${s.titre}</h3><span class="rf-sit-num">Situation ${n} / ${ordre.length}</span></div>
        <div class="rf-manip">
          <div class="rf-manip-fig"><p class="rf-fig-t">${s.texte}</p><div class="rf-fig"></div></div>
          <div class="rf-manip-panneau"><div class="rf-donnees">${donnees(c)}</div><div data-a="parties"></div><div data-a="suite"></div></div>
        </div>`;
      zone.appendChild(carte);
      RF.figure(carte.querySelector('.rf-fig'), s, null, { valeurs: valeurs(c), aria: 'Schéma complet : ' + s.titre });
      const q = { parties: RF.partiesCalcul(Object.assign({}, c, c.inconnue === 's1' ? {} : {})) };
      window.RF.questionEnCours = q;
      RF.question(carte.querySelector('[data-a="parties"]'), q, {
        fin() {
          const sv = carte.querySelector('[data-a="suite"]');
          sv.innerHTML = `<div class="er-actions"><button type="button" class="btn-primary">${n < ordre.length ? 'Situation suivante →' : 'Voir le bilan →'}</button></div>`;
          sv.querySelector('button').onclick = () => { num++; afficher(); };
          RF.defiler(sv);
        },
      }, 'manip');
    }
    function bilan() {
      SOM.marquer({ fait: true });
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">BILAN</span>
        <div class="cle"><p><b class="cle-titre">À retenir.</b> Loi de Descartes pour la réfraction : <b>${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)})</b>, avec ${nH(1)} l'indice du milieu d'incidence et ${nH(2)} celui du milieu de réfraction.</p>
          <p><b>Méthode :</b> écris la loi en adaptant les notations (${nH('air')}, ${nH('eau')}…), donne l'expression littérale de ce que tu cherches, calcule avec la calculatrice <b>en degrés</b>, puis l'angle avec sin<sup>−1</sup> (« SHIFT sin » puis « ans »), avec le bon nombre de chiffres significatifs.</p></div>
        ${RF.revois(['equations'])}
        <div class="er-actions">
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_3_simulation.html">Module 3 : simulateur →</a>
        </div>`;
      zone.appendChild(carte);
      carte.querySelector('[data-a="re"]').onclick = () => { ordre = RF.melanger(DONNEES_LOI); num = 0; afficher(); };
    }
    afficher();
  }

  Object.assign(RF, { DONNEES_LOI, sitCalcul, i1De, valeurs, donnees, manipLoi });
})();
