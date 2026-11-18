/* ============================================================
   Module 3 : la loi de Descartes
   RF.figureGenerique(zone)       schéma générique : milieu 1 (n₁), milieu 2 (n₂), i₁, i₂
   RF.figureValeurs(zone, cas)    schéma avec n × sin(i) écrit de chaque côté ('air-eau' ou 'eau-air')
   RF.aideLoi(zone)               bouton « 📖 La loi de Descartes » (fenêtre : schéma générique et loi)
   RF.DONNEES_LOI                 données de calcul (situations du module 1)
   RF.sitCalcul(c)                situation du module 1 redessinée avec les angles du calcul
   RF.manipEcrire(zone)           3b : écrire la loi pour les 7 situations du module 1 (rien d'autre)
   RF.manipUtiliser(zone)         3c : utiliser la loi, deux parcours au choix :
                                  « Niveau seconde » (loi, valeurs numériques, sinus ou indice, Arcsin)
                                  « Préparer la spécialité » (loi, expression littérale, calcul, Arcsin)
   ============================================================ */
(function () {
  'use strict';

  const nH = RF.nHTML, iH = RF.iHTML, fmt = RF.fmt;
  const sit = id => RF.SITUATIONS.find(s => s.id === id);

  /* ---------- Schémas du cours ---------- */
  function figureGenerique(zone) {
    const s = Object.assign({}, sit('aquarium'), { reflechi: false, titre: 'schéma générique',
      etiq1: `milieu 1<br>indice ${nH(1)}`, etiq2: `milieu 2<br>indice ${nH(2)}` });
    return RF.figure(zone, s, null, { aria: 'Schéma générique : le rayon passe du milieu 1, d\'indice n1, au milieu 2, d\'indice n2 ; angles i1 et i2' });
  }
  // de l'air vers l'eau (i₁ = 50°) ou de l'eau vers l'air (i₁ = 30°) : n × sin(i) a la même valeur des deux côtés
  const CAS = {
    'air-eau': { base: 'aquarium', m1: 'air', m2: 'eau', i1: 50 },
    'eau-air': { base: 'piece', m1: 'eau', m2: 'air', i1: 30 },
  };
  function figureValeurs(zone, cle) {
    const c = CAS[cle], m1 = RF.MILIEUX[c.m1], m2 = RF.MILIEUX[c.m2];
    const p = m1.n * RF.sinD(c.i1), i2 = RF.asinD(p / m2.n);
    const s = Object.assign({}, sit(c.base), { i1: c.i1, m1: c.m1, m2: c.m2, reflechi: false, source: 'lampe',
      etiq1: `${m1.nom} : ${nH(1)} = ${fmt(m1.n, 2)}<br>${nH(1)} × sin(${iH(1)}) = ${fmt(p, 3)}`,
      etiq2: `${m2.nom} : ${nH(2)} = ${fmt(m2.n, 2)}<br>${nH(2)} × sin(${iH(2)}) = ${fmt(p, 3)}` });
    return RF.figure(zone, s, null, { valeurs: { i1: fmt(c.i1, 0) + '°', i2: fmt(i2, 1) + '°' }, aria: `Réfraction de ${m1.le} vers ${m2.le}` });
  }
  // fenêtre d'aide : schéma générique et loi
  function aideLoi(zone) {
    return RF.boutonAide(zone, '📖 La loi de Descartes', 'La loi de Descartes', corps => {
      corps.innerHTML = `<div class="rf-ref"><div class="rf-ref-fig"></div><div>
        <div class="cle"><p class="rf-loi">${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)})</p></div>
        <ul class="rf-legende"><li><b>Milieu 1</b> : celui du rayon incident, d'indice ${nH(1)} ; ${iH(1)} : angle d'incidence.</li>
          <li><b>Milieu 2</b> : celui du rayon réfracté, d'indice ${nH(2)} ; ${iH(2)} : angle de réfraction.</li>
          <li>On adapte les notations à la situation : ${nH('air')}, ${nH('eau')}, ${nH('verre')}…</li></ul></div></div>`;
      figureGenerique(corps.querySelector('.rf-ref-fig'));
    });
  }

  /* ---------- Données de calcul ----------
     dec : décimales des angles donnés ; csAngle : chiffres significatifs du résultat */
  const DONNEES_LOI = [
    { sit: 'aquarium', m1: 'air', m2: 'eau', i1: 30, dec: 1, inconnue: 's2', csAngle: 3 },
    { sit: 'piece', m1: 'eau', m2: 'air', i2: 35, dec: 1, inconnue: 's1', csAngle: 3 },
    { sit: 'vitre', m1: 'air', m2: 'verre', i1: 55, dec: 0, inconnue: 's2', csAngle: 2 },
    { sit: 'demi', m1: 'air', m2: 'plexi', i1: 60, i2: 35.1, dec: 1, inconnue: 'n2' },
    { sit: 'prisme', m1: 'verre', m2: 'air', i1: 30, dec: 1, inconnue: 's2', csAngle: 3 },
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

  // carte d'une situation : figure à gauche ; à droite, les questions et l'aide
  function carteSituation(zone, titre, texte, n, total) {
    const carte = RF.el('div', 'er-card');
    carte.innerHTML = `<div class="rf-sit-tete"><h3 class="rf-sit-titre">${titre}</h3><span class="rf-sit-num">Situation ${n} / ${total}</span></div>
      <div class="rf-manip">
        <div class="rf-manip-fig"><p class="rf-fig-t">${texte}</p><div class="rf-fig"></div></div>
        <div class="rf-manip-panneau"><div data-a="donnees"></div><div data-a="parties"></div><div data-a="suite"></div><div data-a="aide"></div></div>
      </div>`;
    zone.appendChild(carte);
    return carte;
  }
  function boutonSuite(carte, dernier, suite) {
    const sv = carte.querySelector('[data-a="suite"]');
    sv.innerHTML = `<div class="er-actions"><button type="button" class="btn-primary">${dernier ? 'Terminer →' : 'Situation suivante →'}</button></div>`;
    sv.querySelector('button').onclick = suite;
    RF.defiler(sv);
  }

  /* ============================================================
     3b : ÉCRIRE LA LOI (7 situations du module 1, schéma complet)
     ============================================================ */
  function manipEcrire(zone) {
    let ordre = RF.SITUATIONS.map(s => ({ sit: s, orient: null })), num = 0;
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      if (num < ordre.length) situation(ordre[num], num + 1);
      else fin();
    }
    function situation(item, n) {
      const s = item.sit;
      const carte = carteSituation(zone, s.titre, s.texte.replace(/<b>.*<\/b>/, ''), n, ordre.length);
      RF.figure(carte.querySelector('.rf-fig'), s, item.orient, { aria: 'Schéma complet : ' + s.titre });
      aideLoi(carte.querySelector('[data-a="aide"]'));
      const loi = RF.partiesCalcul({ m1: s.m1, m2: s.m2, i1: s.i1, inconnue: 's2', valeurs: true })[0];
      const q = { parties: [loi] };
      window.RF.questionEnCours = q;
      RF.question(carte.querySelector('[data-a="parties"]'), q, { fin: () => boutonSuite(carte, n === ordre.length, () => { num++; afficher(); }) }, 'manip');
    }
    function fin() {
      SOM.marquer({ fait: true });
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">TERMINÉ</span>
        <div class="cle"><p><b class="cle-titre">À retenir.</b> ${nH(1)} × sin(${iH(1)}) = ${nH(2)} × sin(${iH(2)}), en adaptant les notations : le milieu 1 est celui du rayon incident.</p></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_3c_manip.html">Utiliser la loi de Descartes →</a></div>`;
      zone.appendChild(carte);
      carte.querySelector('[data-a="re"]').onclick = () => {
        ordre = RF.melanger(RF.SITUATIONS).map(s => ({ sit: s, orient: RF.hasard(RF.ORIENTATIONS(s)) }));
        num = 0; afficher();
      };
    }
    afficher();
  }

  /* ============================================================
     3c : UTILISER LA LOI (deux parcours)
     ============================================================ */
  const PARCOURS = {
    seconde: { nom: 'Parcours 1 · Niveau seconde', court: 'parcours 1',
      etapes: 'écrire la loi avec les bons indices, remplacer par les valeurs numériques, calculer le sinus (ou l\'indice) calculatrice en degrés, puis l\'angle avec Arcsin.' },
    specialite: { nom: 'Parcours 2 · Pour préparer la spécialité physique-chimie de 1re', court: 'parcours 2',
      etapes: 'écrire la loi, isoler la grandeur cherchée (expression littérale), puis faire le calcul numérique et trouver l\'angle avec Arcsin.' },
  };
  function manipUtiliser(zone) {
    let parcours = null, num = 0, ordre = DONNEES_LOI.slice();
    function choisir() {
      zone.innerHTML = '';
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<h3 class="rf-sit-titre">Choisis ton parcours</h3>
        <p class="er-contexte">Conseil : fais les deux parcours dans l'ordre. Le parcours 2 est facultatif ; si tu es déjà très à l'aise, tu peux commencer directement par lui.</p>
        <div class="rf-parcours">${Object.keys(PARCOURS).map(k => `<button type="button" class="rf-parcours-b" data-p="${k}"><b>${PARCOURS[k].nom}</b><span>${k === 'seconde' ? 'Conseillé, à faire d\'abord. ' : 'Facultatif. '}Pour chaque situation : ${PARCOURS[k].etapes}</span></button>`).join('')}</div>
        <div data-a="degres"></div>`;
      zone.appendChild(carte);
      RF.aideDegres(carte.querySelector('[data-a="degres"]'));
      carte.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => { parcours = b.dataset.p; num = 0; ordre = DONNEES_LOI.slice(); afficher(); }; });
      window.scrollTo(0, 0);
    }
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      if (num < ordre.length) situation(ordre[num], num + 1);
      else fin();
    }
    function situation(c, n) {
      const s = sitCalcul(c);
      const carte = carteSituation(zone, s.titre, s.texte.replace(/<b>.*<\/b>/, ''), n, ordre.length);
      carte.querySelector('.rf-sit-tete').insertAdjacentHTML('afterend', `<p class="rf-parcours-nom">${PARCOURS[parcours].nom}</p>`);
      RF.figure(carte.querySelector('.rf-fig'), s, null, { valeurs: valeurs(c), aria: 'Schéma complet : ' + s.titre });
      carte.querySelector('[data-a="donnees"]').innerHTML = `<div class="rf-donnees">${donnees(c)}</div>`;
      if (parcours === 'specialite' && n === 1) {
        carte.querySelector('[data-a="donnees"]').insertAdjacentHTML('beforeend', `<div class="callout-accent rf-liens-spe"><p>Pour t'entraîner à isoler une grandeur et à utiliser la fonction réciproque du sinus (Arcsin) :</p>${RF.revois(['reciproque', 'mobile'])}</div>`);
      }
      aideLoi(carte.querySelector('[data-a="aide"]'));
      const q = { parties: RF.partiesCalcul(Object.assign({}, c, parcours === 'seconde' ? { valeurs: true } : {})) };
      window.RF.questionEnCours = q;
      RF.question(carte.querySelector('[data-a="parties"]'), q, { fin: () => boutonSuite(carte, n === ordre.length, () => { num++; afficher(); }) }, 'manip');
    }
    function fin() {
      SOM.marquer({ fait: true });
      const autre = parcours === 'seconde' ? 'specialite' : 'seconde';
      const carte = RF.el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">${PARCOURS[parcours].court.toUpperCase()} TERMINÉ</span>
        <div class="cle"><p><b class="cle-titre">Méthode.</b> ${parcours === 'seconde'
          ? 'Écris la loi avec les notations de la situation, remplace les grandeurs connues par leurs valeurs, divise pour obtenir le sinus (ou l\'indice), calculatrice <b>en degrés</b>, puis l\'angle avec Arcsin (touche sin<sup>−1</sup>).'
          : 'Écris la loi, isole la grandeur cherchée (expression littérale), remplace par les valeurs, calculatrice <b>en degrés</b>, puis l\'angle avec Arcsin (touche sin<sup>−1</sup>), avec le bon nombre de chiffres significatifs.'}</p></div>
        ${parcours === 'specialite' ? RF.revois(['reciproque', 'mobile']) : ''}
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer ce parcours</button>
          <button type="button" class="btn-secondary" data-a="autre">${PARCOURS[autre].nom.split(' · ')[0]}${autre === 'specialite' ? ' (facultatif)' : ''} →</button>
          <a class="btn-primary" style="text-decoration:none" href="module_4_questions.html">Module 4 : exercices d'application →</a></div>`;
      zone.appendChild(carte);
      carte.querySelector('[data-a="re"]').onclick = () => { num = 0; ordre = RF.melanger(DONNEES_LOI); afficher(); };
      carte.querySelector('[data-a="autre"]').onclick = () => { parcours = autre; num = 0; ordre = DONNEES_LOI.slice(); afficher(); };
    }
    choisir();
    RF.utiliserEnCours = { choisir: p => { parcours = p; num = 0; ordre = DONNEES_LOI.slice(); afficher(); } };
  }

  Object.assign(RF, { figureGenerique, figureValeurs, aideLoi, DONNEES_LOI, sitCalcul, i1De, valeurs, donnees, manipEcrire, manipUtiliser });
})();
