/* ============================================================
   Banc d'optique — manipulations (BO.TP)
   « Banc libre » puis quatre TP guidés, dans l'ordre du menu :
     conjugaison     vérifier la relation de conjugaison (série de mesures, graphique)
     autocollimation distance focale d'une lentille mystère avec un miroir plan
     bessel          méthode de Bessel, condition D ≥ 4f′
     lunette         objet à l'infini, objectif et oculaire, image intermédiaire,
                     œil, grossissement, cercle oculaire

   Chaque TP : { menu, titre, banc (longueur, cm), montage() → composants de départ,
                 etapes: [{ titre, rendre(api) }] } (api : voir apiEtape dans bo.js).
   Les questions utilisent le moteur commun assets/cours.js (COURS.question) ;
   une manipulation sur le banc est une partie « perso » (api.manip) réussie dès que
   le banc est dans l'état demandé ; « Afficher la réponse » fait la manipulation.
   Les valeurs attendues qui dépendent des mesures de l'élève sont des accesseurs (get).
   ============================================================ */
(function () {
  'use strict';
  const fmt = BO.fmt, fmtF = BO.fmtF;
  const A = s => `<span class="bo-alg">${s}</span>`;                 // mesure algébrique (trait au-dessus)
  const CALC = ' <span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';
  const hasard = t => t[Math.floor(Math.random() * t.length)];

  // composants du banc
  const lampe = api => api.trouver(c => c.type === 'lampe');
  const ecrans = api => api.comps().filter(c => c.type === 'ecran' && !c.retire);
  const ecranNet = api => ecrans(api).find(e => { const t = api.cible(e); return t && t.nette; }) || null;
  // position de l'image d'un objet réel par une lentille convergente (relation de conjugaison)
  const conj = (OA, f) => 1 / (1 / f + 1 / OA);
  // un écran de la scène (le premier), créé s'il n'y en a pas
  function unEcran(api, x) {
    let e = api.comps().find(c => c.type === 'ecran');
    if (!e) e = api.ajouter({ type: 'ecran' }, x);
    e.retire = false;
    return e;
  }
  // tableau de mesures (reconstruit à chaque ajout)
  function tableau(zone, entetes, lignes, vides) {
    zone.innerHTML = `<div class="bo-tab-defile"><table class="bo-tab"><thead><tr>${entetes.map(e => `<th>${e}</th>`).join('')}</tr></thead>
      <tbody>${lignes.map(l => `<tr>${l.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
      ${Array.from({ length: Math.max(0, vides || 0) }, () => `<tr>${entetes.map(() => '<td class="vide">…</td>').join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  /* ============================================================
     BANC LIBRE
     ============================================================ */
  BO.TP.libre = {
    menu: 'Banc libre', titre: 'Banc libre', banc: 100,
    montage: () => [{ type: 'lampe', x: 0, AB: 2 }, { type: 'cv', x: 30, f: 10, D: 4 }, { type: 'ecran', x: 60 }],
  };

  /* ============================================================
     TP 1 : RELATION DE CONJUGAISON
     ============================================================ */
  const CJ = { mesures: [], premiere: null, modele: null };
  const SERIE = [-15, -20, -25, -40, -60];
  BO.TP.conjugaison = {
    menu: 'TP : relation de conjugaison', titre: 'Relation de conjugaison', banc: 100,
    montage() {
      CJ.mesures = []; CJ.premiere = null; CJ.modele = null;
      return [{ type: 'lampe', x: 0, AB: 2, verrou: { suppr: true } }, { type: 'cv', x: 25, f: 10, D: 4, verrou: { f: true } }, { type: 'ecran', x: 60 }];
    },
    etapes: [
      {
        titre: 'Montage',
        rendre(api) {
          api.bloc(api.g, `<p>La lanterne éclaire l'objet AB, une lettre F : A sur l'axe optique, B en haut de la lettre. La lentille L₁ (centre optique O, f′ = 10 cm) en donne une image A′B′ que l'on cherche sur l'écran.</p>
            <div class="cle"><p><b>Mesures algébriques.</b> L'axe optique est orienté dans le sens de la lumière, de la lanterne vers l'écran. A est avant O : ${A('OA')} &lt; 0 ; une image réelle A′ est après O : ${A('OA′')} &gt; 0.</p></div>
            <div class="cle"><p><b>Relation de conjugaison.</b> 1/${A('OA′')} − 1/${A('OA')} = 1/f′</p></div>`);
          api.question(api.d, { parties: [
            { type: 'choix', q: `Sur le banc, la lentille est à 25,0 cm de l'objet. Que vaut ${A('OA')} ?`, melanger: false,
              options: [{ id: 'a', label: '−25,0 cm' }, { id: 'b', label: '25,0 cm' }, { id: 'c', label: '−0,25 cm' }], bonne: 'a',
              indices: { b: `A est avant O dans le sens de la lumière : ${A('OA')} est négative.`, c: `La distance est 25,0 cm : ${A('OA')} s'exprime ici en centimètres.` } },
            { type: 'choix', q: `Avec cette lentille (f′ = 10 cm), l'image est nette quand l'écran est à 41,7 cm de l'objet. Que vaut ${A('OA′')} ?`, melanger: false,
              options: [{ id: 'a', label: '16,7 cm' }, { id: 'b', label: '41,7 cm' }, { id: 'c', label: '−16,7 cm' }], bonne: 'a',
              indices: { b: `41,7 cm est la distance de l'objet à l'écran. ${A('OA′')} va de O (la lentille) à A′ (l'écran) : 41,7 − 25,0.`, c: `A′ est après O dans le sens de la lumière : ${A('OA′')} est positive.` },
              solution: `<p>${A('OA′')} = 41,7 − 25,0 = 16,7 cm. Tu peux le vérifier : déplace l'écran à 41,7 cm, l'image devient nette.</p>` },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Première image',
        rendre(api) {
          api.bloc(api.g, `<p>Place la lentille à <b>30,0 cm</b> de l'objet (${A('OA')} = −30,0 cm), puis déplace l'<b>écran</b> jusqu'à ce que l'image soit <b>nette</b>.</p>
            <p>Glisse les composants le long du banc, ou choisis-les et utilise les boutons ± 1 cm et ± 1 mm. Clique sur une vue pour l'agrandir.</p>`);
          const m = () => CJ.premiere || { OA: -30, OAi: 15 };
          api.question(api.d, { parties: [
            api.manip({
              q: 'Lentille à 30,0 cm de l\'objet, image nette sur l\'écran.',
              test() { const l = lampe(api), L = api.trouver(c => c.type === 'cv'); const e = ecranNet(api); return l && L && e && Math.abs(L.x - l.x - 30) < 0.05 && e.x > L.x; },
              ok() { const l = lampe(api), L = api.trouver(c => c.type === 'cv'), e = ecranNet(api) || unEcran(api); CJ.premiere = { OA: l.x - L.x, OAi: e.x - L.x, xE: e.x, xL: L.x }; },
              montrer() { const l = lampe(api), L = api.trouver(c => c.type === 'cv'); api.placer(L, l.x + 30); api.placer(unEcran(api), L.x + conj(l.x - L.x, L.f)); },
            }),
            { type: 'nombre', q: `Lis les positions sur le banc et calcule ${A('OA′')}.`, label: `${A('OA′')} =`, unite: 'cm', tol: 0.15,
              get valeur() { return m().OAi; },
              diag: v => Math.abs(v - m().xE) < 0.15 && Math.abs(m().xE - m().OAi) > 0.2 ? `${fmt(m().xE)} cm est la position de l'écran sur le banc. ${A('OA′')} va de la lentille à l'écran : fais la différence des positions.`
                : Math.abs(v + m().OAi) < 0.15 ? `A′ est après O : ${A('OA′')} est positive.`
                : `${A('OA′')} = position de l'écran − position de la lentille.` },
            { type: 'nombre', q: `Calcule 1/${A('OA′')} − 1/${A('OA')}.`, label: `1/${A('OA′')} − 1/${A('OA')} =`, unite: 'cm⁻¹' + CALC, rel: 0.02,
              get valeur() { return 1 / m().OAi - 1 / m().OA; },
              diag: v => Math.abs(v - (1 / m().OAi + 1 / m().OA)) < 0.003 ? `Attention au signe : ${A('OA')} = ${fmt(m().OA)} cm est négative, donc − 1/${A('OA')} = + 1/${fmt(-m().OA)}.`
                : `Calcule 1/${fmt(m().OAi)} − 1/(${fmt(m().OA)}), avec ${A('OA')} négative.` },
            { type: 'choix', q: 'Compare avec 1/f′ = 1/10 = 0,100 cm⁻¹.', melanger: false,
              options: [{ id: 'a', label: 'C\'est égal, aux erreurs de mesure près' }, { id: 'b', label: 'C\'est très différent' }], bonne: 'a',
              indices: { b: 'Relis ton calcul : tu dois trouver environ 0,100 cm⁻¹.' },
              solution: '<p>La relation de conjugaison est vérifiée pour cette position de la lentille. On la vérifie maintenant pour plusieurs positions.</p>' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Série de mesures',
        rendre(api) {
          api.bloc(api.g, `<p>Pour chaque mesure, place la lentille à la distance demandée de l'objet, rends l'image <b>nette</b>, puis écris ${A('OA′')}. Le tableau calcule les inverses.</p>`);
          const tab = api.bloc(api.d, '', 'bo-bloc');
          const majTab = () => tableau(tab, [`${A('OA')} (cm)`, `${A('OA′')} (cm)`, `1/${A('OA')} (cm⁻¹)`, `1/${A('OA′')} (cm⁻¹)`],
            CJ.mesures.map(p => [fmt(p.OA), fmt(p.OAi), fmt(1 / p.OA, 4), fmt(1 / p.OAi, 4)]), SERIE.length - CJ.mesures.length);
          majTab();
          const suivante = () => {
            const k = CJ.mesures.length;
            if (k >= SERIE.length) { api.bloc(api.g, `<p class="bo-mes">✓ Les ${SERIE.length} mesures sont dans le tableau.</p>`); api.continuer(api.g); return; }
            const OA = SERIE[k];
            let mes = null;
            api.question(api.g, { enonce: `<p><b>Mesure ${k + 1} / ${SERIE.length} :</b> ${A('OA')} = ${fmt(OA)} cm.</p>`, parties: [
              api.manip({
                q: `Lentille à ${fmt(-OA)} cm de l'objet, image nette sur l'écran.`,
                test() { const l = lampe(api), L = api.trouver(c => c.type === 'cv'), e = ecranNet(api); return l && L && e && Math.abs(L.x - l.x + OA) < 0.05 && e.x > L.x; },
                ok() { const L = api.trouver(c => c.type === 'cv'), e = ecranNet(api) || unEcran(api); mes = { OA, OAi: e.x - L.x, xE: e.x }; },
                montrer() { const l = lampe(api), L = api.trouver(c => c.type === 'cv'); api.placer(L, l.x - OA); api.placer(unEcran(api), L.x + conj(OA, L.f)); },
              }),
              { type: 'nombre', q: `Écris ${A('OA′')}.`, label: `${A('OA′')} =`, unite: 'cm', tol: 0.15,
                get valeur() { return mes ? mes.OAi : conj(OA, 10); },
                diag: v => mes && Math.abs(v - mes.xE) < 0.15 ? `C'est la position de l'écran sur le banc : ${A('OA′')} = position de l'écran − position de la lentille.` : v < 0 ? `${A('OA′')} est positive : A′ est après O.` : `${A('OA′')} = position de l'écran − position de la lentille.` },
            ] }, () => { CJ.mesures.push(mes || { OA, OAi: conj(OA, 10) }); majTab(); suivante(); });
          };
          // mesures déjà faites (retour sur cette étape)
          suivante();
        },
      },
      {
        titre: 'Graphique',
        rendre(api) {
          if (CJ.mesures.length < 2) {
            api.bloc(api.g, '<p>Fais d\'abord la série de mesures (étape 3) : il faut au moins deux points pour tracer le graphique.</p>');
            return;
          }
          api.bloc(api.g, `<p>Chaque mesure donne un point (1/${A('OA')} ; 1/${A('OA′')}).</p>`);
          const zg = api.bloc(api.g, '<div data-fig></div><div class="bo-graphe-cote"><button type="button" class="btn-small">Modéliser par une droite</button><p class="bo-mes" data-eq></p></div>', 'bo-graphe-zone');
          const fig = zg.querySelector('[data-fig]'), bt = zg;
          const pts = CJ.mesures.map(p => [1 / p.OA, 1 / p.OAi]);
          const dessiner = () => { fig.innerHTML = graphe(pts, CJ.modele); };
          dessiner();
          const modeliser = () => {
            const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0);
            const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
            const a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n;
            CJ.modele = { a, b };
            dessiner();
            bt.querySelector('[data-eq]').innerHTML = `Modèle : 1/${A('OA′')} = ${fmt(a, 2)} × 1/${A('OA')} + ${fmt(b, 4)} (en cm⁻¹)`;
            bt.querySelector('button').disabled = true;
          };
          if (CJ.modele) modeliser();
          bt.querySelector('button').addEventListener('click', () => { modeliser(); api.changer(); });
          const b = () => (CJ.modele ? CJ.modele.b : 0.1);
          api.question(api.d, { parties: [
            api.manip({ q: 'Modélise les points par une droite (bouton sous le graphique).', attente: 'En attente du modèle…', test: () => !!CJ.modele, montrer: modeliser }),
            { type: 'choix', q: 'Le coefficient directeur a de la droite vaut environ :', melanger: false,
              options: [{ id: 'a', label: '1' }, { id: 'b', label: '−1' }, { id: 'c', label: '10' }], bonne: 'a',
              indices: { b: 'La droite monte : son coefficient directeur est positif.', c: 'Lis a dans l\'équation du modèle, sous le graphique.' } },
            { type: 'choix', q: `La relation de conjugaison s'écrit 1/${A('OA′')} = 1/${A('OA')} + 1/f′. Que représente l'ordonnée à l'origine b ?`, melanger: false,
              options: [{ id: 'a', label: '1/f′' }, { id: 'b', label: 'f′' }, { id: 'c', label: `${A('OA′')}` }], bonne: 'a',
              indices: { b: 'b est en cm⁻¹ : c\'est l\'inverse d\'une longueur.', c: `${A('OA′')} change d'une mesure à l'autre ; b est une constante.` } },
            { type: 'nombre', q: 'Déduis-en la distance focale de la lentille.', label: 'f′ = 1/b =', unite: 'cm' + CALC, rel: 0.02,
              get valeur() { return 1 / b(); },
              diag: v => Math.abs(v - b()) < 0.01 ? 'Tu as recopié b : f′ est l\'inverse de b.' : 'Calcule 1 / b avec la valeur de b du modèle.' },
            { type: 'choix', q: 'Cette valeur est-elle compatible avec f′ = 10 cm, indiquée sur la lentille ?', melanger: false,
              options: [{ id: 'a', label: 'Oui' }, { id: 'b', label: 'Non' }], bonne: 'a',
              indices: { b: 'Compare : tu trouves une valeur très proche de 10 cm.' },
              solution: `<p>a ≈ 1 et b ≈ 1/f′ : les mesures vérifient la relation de conjugaison 1/${A('OA′')} − 1/${A('OA')} = 1/f′.</p>` },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Bilan',
        rendre(api) {
          api.bloc(api.g, `<div class="cle"><p><b>Relation de conjugaison d'une lentille mince.</b> 1/${A('OA′')} − 1/${A('OA')} = 1/f′, avec des mesures algébriques sur l'axe orienté dans le sens de la lumière.</p></div>
            <p>Pour un objet réel placé avant le foyer objet F, l'image est réelle : on la recueille sur un écran.</p>`);
          const L = api.trouver(c => c.type === 'cv'), f = L ? L.f : 10;
          api.question(api.d, { parties: [
            { type: 'nombre', q: `Avec cette lentille (f′ = ${fmtF(f)} cm), calcule ${A('OA′')} pour un objet placé à 50,0 cm avant la lentille.`, label: `${A('OA′')} =`, unite: 'cm' + CALC, rel: 0.01,
              valeur: conj(-50, f),
              diag: v => Math.abs(v - conj(50, f)) < 0.2 ? `${A('OA')} = −50,0 cm (négative) : 1/${A('OA′')} = 1/f′ + 1/${A('OA')} = 1/${fmtF(f)} − 1/50.` : `1/${A('OA′')} = 1/f′ + 1/${A('OA')}, avec ${A('OA')} = −50,0 cm.` },
            api.manip({
              q: 'Vérifie sur le banc : lentille à 50,0 cm de l\'objet, écran à la position calculée. L\'image doit être nette.',
              test() { const l = lampe(api), L2 = api.trouver(c => c.type === 'cv'), e = ecranNet(api); return l && L2 && e && Math.abs(L2.x - l.x - 50) < 0.05; },
              montrer() { const l = lampe(api), L2 = api.trouver(c => c.type === 'cv'); api.placer(L2, l.x + 50); api.placer(unEcran(api), L2.x + conj(-50, L2.f)); },
              solution: '<p>L\'image est nette à la position prévue par la relation de conjugaison.</p>',
            }),
          ] }, () => api.continuer(api.d));
        },
      },
    ],
  };

  // graphique 1/OA′ en fonction de 1/OA (SVG), avec la droite modélisée
  function graphe(pts, modele) {
    const W = 440, H = 200, g = 54, d = 16, h = 16, b = 36;
    const xmin = Math.min(-0.07, Math.min(...pts.map(p => p[0])) * 1.1), xmax = 0;
    const ymax = Math.max(0.12, Math.max(...pts.map(p => p[1])) * 1.1);
    const X = x => g + (x - xmin) / (xmax - xmin) * (W - g - d), Y = y => H - b - y / ymax * (H - b - h);
    const s = [];
    for (let x = 0; x >= xmin - 1e-9; x -= 0.01) s.push(`<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(ymax)}" class="g-grille"/><text x="${X(x)}" y="${Y(0) + 15}" class="g-grad" text-anchor="middle">${fmt(x, 2)}</text>`);
    for (let y = 0; y <= ymax + 1e-9; y += 0.02) s.push(`<line x1="${X(xmin)}" y1="${Y(y)}" x2="${X(0)}" y2="${Y(y)}" class="g-grille"/><text x="${X(xmin) - 5}" y="${Y(y) + 4}" class="g-grad" text-anchor="end">${fmt(y, 2)}</text>`);
    s.push(`<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(0)}" class="g-axe"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(ymax)}" class="g-axe"/>`);
    s.push(`<text x="${X(xmin)}" y="${H - 6}" class="g-nom">1/OA (cm⁻¹)</text><text x="${X(0) - 4}" y="${h - 2}" class="g-nom" text-anchor="end">1/OA′ (cm⁻¹)</text>`);
    if (modele) s.push(`<line x1="${X(xmin)}" y1="${Y(modele.a * xmin + modele.b)}" x2="${X(0)}" y2="${Y(modele.b)}" class="g-droite"/>`);
    for (const p of pts) s.push(`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4.5" class="g-point"/>`);
    return `<svg class="bo-graphe" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graphique de 1/OA′ en fonction de 1/OA : ${pts.length} points${modele ? ' et la droite modélisée' : ''}">${s.join('')}</svg>`;
  }

  /* ============================================================
     TP 2 : AUTOCOLLIMATION
     ============================================================ */
  const AC = { xL: null };
  BO.TP.autocollimation = {
    menu: 'TP : autocollimation', titre: 'Autocollimation', banc: 100,
    montage() {
      AC.xL = null;
      return [{ type: 'lampe', x: 0, AB: 1, verrou: { suppr: true } },
        { type: 'cv', x: 35, f: hasard([10, 12.5, 15, 20, 25]), D: 6, mystere: true },
        { type: 'plan', x: 42, D: 6 }];
    },
    etapes: [
      {
        titre: 'Principe',
        rendre(api) {
          const L = () => api.trouver(c => c.type === 'cv'), M = () => api.trouver(c => c.type === 'plan');
          api.bloc(api.g, `<p>La lentille L₁ est une <b>lentille mystère</b> : sa distance focale est cachée. Le <b>miroir plan</b>, placé juste derrière la lentille, renvoie la lumière vers la lanterne.</p>
            <p><b>Déplace la lentille</b> (et le miroir avec elle, juste derrière) jusqu'à obtenir une <b>image nette sur la plaque de la lanterne</b> : regarde la vue au-dessus de la lanterne, clique dessus pour l'agrandir.</p>`);
          api.question(api.d, { parties: [
            api.manip({
              q: 'Place la lentille de façon à avoir une image nette sur la plaque de la lanterne.',
              test() { const t = api.cible(lampe(api)); return t && t.nette && t.lumiere; },
              ok() { AC.xL = L().x - lampe(api).x; },
              montrer() { const l = lampe(api); api.placer(L(), l.x + L().f); if (M()) api.placer(M(), L().x + 6); },
              solution: '<p>L\'image renvoyée par le miroir est nette sur la plaque de la lanterne, à côté de la lettre F.</p>',
            }),
            { type: 'choix', q: 'L\'image se forme sur l\'objet lui-même. Comment sont les rayons issus d\'un même point de l\'objet, entre la lentille et le miroir ?', melanger: false, colonne: true,
              options: [{ id: 'a', label: 'Parallèles entre eux' }, { id: 'b', label: 'Ils convergent en un point' }, { id: 'c', label: 'Ils divergent' }], bonne: 'a',
              indices: { b: 'Coche « Faisceau » si besoin : entre la lentille et le miroir, le faisceau garde la même largeur.', c: 'Regarde le faisceau entre la lentille et le miroir : il garde la même largeur.' },
              solution: '<p>Parallèles entre eux : le faisceau parallèle revient parallèle après le miroir plan, et la lentille le fait converger dans son plan focal objet, c\'est-à-dire sur l\'objet lui-même.</p>' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Image sur la plaque',
        rendre(api) {
          api.bloc(api.g, '<p>Compare, dans la vue de la plaque, la lettre F (l\'objet) et son image renvoyée par le miroir. Utilise la règle de la vue (boutons − et + pour changer d\'échelle).</p>');
          api.question(api.d, { parties: [
            { type: 'choix', q: 'Par rapport à l\'objet, l\'image renvoyée est :', melanger: false, colonne: true,
              options: [{ id: 'a', label: 'de même taille et renversée' }, { id: 'b', label: 'de même taille et droite' }, { id: 'c', label: 'plus grande et renversée' }], bonne: 'a',
              indices: { b: 'Compare dans la vue : la lettre de l\'image a tourné d\'un demi-tour autour de l\'axe.', c: 'Mesure-la avec la règle de la vue : elle a la même hauteur que l\'objet.' },
              solution: '<p>De même taille et renversée : grandissement γ = −1.</p>' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Distance focale',
        rendre(api) {
          const L = () => api.trouver(c => c.type === 'cv'), M = () => api.trouver(c => c.type === 'plan');
          const dist = () => (AC.xL != null ? AC.xL : L().f);
          api.bloc(api.g, '<div class="cle"><p><b>Autocollimation.</b> Quand l\'image renvoyée est nette sur l\'objet, l\'objet est dans le plan focal objet : la distance objet-lentille est égale à la distance focale f′.</p></div>');
          api.question(api.d, { parties: [
            { type: 'nombre', q: 'Lis les positions sur le banc : quelle est la distance focale de la lentille ?', label: 'f′ =', unite: 'cm', tol: 0.15,
              get valeur() { return dist(); },
              diag: () => 'f′ est la distance entre l\'objet (la plaque, à la position de la lanterne) et la lentille, quand l\'image renvoyée est nette.' },
            api.manip({
              q: 'Sans bouger la lentille, éloigne le miroir : au moins 10 cm entre la lentille et le miroir.',
              test() { const l = lampe(api); return M() && M().x - L().x >= 10 && Math.abs(L().x - l.x - dist()) < 0.05; },
              montrer() { const l = lampe(api); api.placer(L(), l.x + dist()); api.placer(M(), L().x + 15); },
            }),
            { type: 'choix', q: 'L\'image sur la plaque est-elle toujours nette ?', melanger: false,
              options: [{ id: 'a', label: 'Oui' }, { id: 'b', label: 'Non' }], bonne: 'a',
              indices: { b: 'Regarde la vue de la plaque : l\'image est toujours nette, elle est seulement moins lumineuse.' },
              solution: '<p>Entre la lentille et le miroir, le faisceau est parallèle : la distance lentille-miroir ne change pas la netteté, seulement la luminosité.</p>' },
            api.manip({
              q: 'Choisis la lentille sur le banc et clique sur « Révéler » pour comparer avec ta mesure.',
              attente: 'En attente de « Révéler »…',
              test: () => !!L().revele,
              montrer() { L().revele = true; api.choisir(L()); },
              get solution() { return `<p>f′ = ${fmtF(L().f)} cm : ta mesure donne ${fmt(dist())} cm.</p>`; },
            }),
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Bilan',
        rendre(api) {
          api.bloc(api.g, `<div class="cle"><p><b>Autocollimation.</b> Une lentille convergente et un miroir plan : l'image renvoyée se forme, nette, sur l'objet lui-même quand l'objet est dans le plan focal objet. On lit alors f′ = distance objet-lentille.</p></div>
            <p>Méthode rapide ; sa précision dépend du jugement de la netteté (environ ± 2 mm ici).</p>`);
          api.question(api.d, { parties: [
            { type: 'choix', q: 'Peut-on mesurer ainsi la distance focale d\'une lentille divergente seule ?', melanger: false,
              options: [{ id: 'a', label: 'Non' }, { id: 'b', label: 'Oui' }], bonne: 'a',
              indices: { b: 'Essaie sur le banc libre : avec une lentille divergente, les rayons issus d\'un point de l\'objet divergent encore plus ; ils ne ressortent jamais parallèles.' },
              solution: '<p>Une lentille divergente ne rend jamais parallèle la lumière issue d\'un objet réel : aucune image ne revient se former sur l\'objet.</p>' },
          ] }, () => api.continuer(api.d));
        },
      },
    ],
  };

  /* ============================================================
     TP 3 : MÉTHODE DE BESSEL
     ============================================================ */
  const BS = { lignes: [], f: [] };
  const DISTANCES = [70, 80, 90];
  BO.TP.bessel = {
    menu: 'TP : méthode de Bessel', titre: 'Méthode de Bessel', banc: 100,
    montage() {
      BS.lignes = []; BS.f = [];
      return [{ type: 'lampe', x: 0, AB: 1, verrou: { suppr: true } },
        { type: 'cv', x: 12, f: hasard([10, 12.5, 15]), D: 4, mystere: true },
        { type: 'ecran', x: 85 }];
    },
    etapes: [
      {
        titre: 'Principe',
        rendre(api) {
          api.bloc(api.g, `<div class="cle"><p><b>Méthode de Bessel.</b> On fixe la distance D entre l'objet et l'écran. Si D ≥ 4f′, il existe <b>deux</b> positions O₁ et O₂ de la lentille qui donnent une image nette. En notant d = O₁O₂ la distance entre ces deux positions :</p>
            <p style="text-align:center;font-weight:800;margin-top:6px">f′ = (D² − d²) / (4D)</p></div>
            <p>La lentille L₁ est une lentille mystère : on va mesurer sa distance focale.</p>`);
          api.question(api.d, { parties: [
            { type: 'choix', q: 'Pour une distance D assez grande, combien de positions de la lentille donnent une image nette sur l\'écran ?', melanger: false,
              options: [{ id: 'a', label: 'Deux' }, { id: 'b', label: 'Une seule' }, { id: 'c', label: 'Une infinité' }], bonne: 'a',
              indices: { b: 'Relis l\'encadré : il y a deux positions O₁ et O₂ (une proche de l\'objet, une proche de l\'écran).', c: 'L\'image n\'est nette que pour des positions bien précises de la lentille.' },
              solution: '<p>Les deux positions sont symétriques : si la lentille en O₁ donne une image nette, la lentille en O₂ échange les rôles de l\'objet et de l\'image.</p>' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Mesures',
        rendre(api) {
          api.bloc(api.g, '<p>Pour chaque distance D : place l\'écran, puis trouve les <b>deux</b> positions de la lentille qui donnent une image nette. Le simulateur relève chaque position dès que l\'image est nette.</p>');
          const tab = api.bloc(api.d, '', 'bo-bloc');
          const majTab = () => {
            tableau(tab, ['D (cm)', 'O₁ (cm)', 'O₂ (cm)', 'd (cm)', 'f′ (cm)'],
              BS.lignes.map(l => [fmt(l.D), fmt(l.x1), fmt(l.x2), fmt(l.d), fmt(l.f, 2)]), DISTANCES.length - BS.lignes.length);
          };
          majTab();
          const L = () => api.trouver(c => c.type === 'cv');
          const suivante = () => {
            const k = BS.lignes.length;
            if (k >= DISTANCES.length) {
              const moy = BS.lignes.reduce((a, l) => a + l.f, 0) / BS.lignes.length;
              api.bloc(api.d, `<p class="bo-mes">Moyenne des trois mesures : f′ ≈ ${fmt(moy, 1)} cm.</p>`);
              api.continuer(api.d);
              return;
            }
            const D = DISTANCES[k], lig = { D };
            const ecranEnD = () => { const l = lampe(api); return ecrans(api).find(e => Math.abs(e.x - l.x - D) < 0.05) || null; };
            const netteEnD = () => { const e = ecranEnD(); const t = e && api.cible(e); return t && t.nette ? e : null; };
            const position = (s) => { const l = lampe(api); const r = Math.sqrt(D * D / 4 - D * L().f); return l.x + D / 2 + s * r; };
            const parties = [
              api.manip({
                q: `Place l'écran à D = ${fmt(D)} cm de l'objet.`,
                test: () => !!ecranEnD(),
                montrer() { const l = lampe(api); api.placer(unEcran(api), l.x + D); },
              }),
              api.manip({
                q: 'Trouve une première position O₁ de la lentille qui donne une image nette.',
                test() { return !!netteEnD(); },
                ok() { lig.x1 = L().x; },
                montrer() { api.placer(L(), position(-1)); },
                get solution() { return `<p>O₁ : lentille à ${fmt(lig.x1 != null ? lig.x1 : position(-1))} cm sur le banc.</p>`; },
              }),
              api.manip({
                q: 'Trouve la deuxième position O₂ de la lentille (à plus de 2 cm de O₁).',
                test() { return !!netteEnD() && Math.abs(L().x - lig.x1) > 2; },
                ok() { lig.x2 = L().x; },
                montrer() { const a = position(-1), b = position(1); api.placer(L(), Math.abs(a - lig.x1) > Math.abs(b - lig.x1) ? a : b); },
                get solution() { return `<p>O₂ : lentille à ${fmt(lig.x2 != null ? lig.x2 : position(1))} cm sur le banc.</p>`; },
              }),
            ];
            const dMes = () => Math.abs(lig.x2 - lig.x1);
            if (k === 0) {
              parties.push(
                { type: 'nombre', q: 'Calcule d = O₁O₂.', label: 'd =', unite: 'cm', tol: 0.15, signe: false,
                  get valeur() { return dMes(); },
                  diag: () => 'd est la distance entre les deux positions de la lentille : différence des deux positions lues sur le banc.' },
                { type: 'nombre', q: 'Calcule la distance focale.', label: 'f′ = (D² − d²) / (4D) =', unite: 'cm' + CALC, tol: 0.05, signe: false,
                  get valeur() { return (D * D - dMes() * dMes()) / (4 * D); },
                  diag: v => Math.abs(v - (D - dMes()) * (D - dMes()) / (4 * D)) < 0.1 ? 'Calcule D² et d² séparément : (D − d)² n\'est pas égal à D² − d².' : 'Calcule D² − d², puis divise par 4 × D.' });
            }
            api.question(api.g, { enonce: `<p><b>Mesure ${k + 1} / ${DISTANCES.length} :</b> D = ${fmt(D)} cm.</p>`, parties },
              () => { lig.d = dMes(); lig.f = (D * D - lig.d * lig.d) / (4 * D); BS.lignes.push(lig); majTab(); suivante(); });
          };
          suivante();
        },
      },
      {
        titre: 'Condition D ≥ 4f′',
        rendre(api) {
          const L = () => api.trouver(c => c.type === 'cv');
          const moy = BS.lignes.length ? BS.lignes.reduce((a, l) => a + l.f, 0) / BS.lignes.length : L().f;
          const Dc = Math.round(3 * L().f * 10) / 10;
          api.bloc(api.g, `<p>Quand D diminue, les deux positions O₁ et O₂ se rapprochent. Que se passe-t-il quand l'écran est très proche de l'objet ?</p>`);
          api.question(api.d, { parties: [
            api.manip({
              q: `Place l'écran à D = ${fmt(Dc)} cm de l'objet, puis déplace la lentille entre l'objet et l'écran.`,
              test() { const l = lampe(api); return ecrans(api).some(e => Math.abs(e.x - l.x - Dc) < 0.05); },
              montrer() { const l = lampe(api); api.placer(unEcran(api), l.x + Dc); api.placer(L(), l.x + Dc / 2); },
            }),
            { type: 'choix', q: 'Peux-tu obtenir une image nette sur l\'écran ?', melanger: false,
              options: [{ id: 'a', label: 'Non, jamais' }, { id: 'b', label: 'Oui' }], bonne: 'a',
              indices: { b: 'Déplace la lentille sur toute la longueur entre l\'objet et l\'écran : l\'image reste floue.' },
              solution: '<p>Il faut D ≥ 4f′ : avec D &lt; 4f′, aucune position de la lentille ne donne d\'image nette. Pour D = 4f′, les deux positions se confondent au milieu.</p>' },
            { type: 'nombre', q: `Avec ta valeur moyenne f′ ≈ ${fmt(moy, 1)} cm, calcule la distance minimale objet-écran.`, label: 'D<sub>min</sub> = 4f′ =', unite: 'cm', rel: 0.02, signe: false,
              valeur: 4 * +moy.toFixed(1),
              diag: v => Math.abs(v - 2 * moy) < 0.5 ? 'Relis l\'encadré : la condition est D ≥ 4f′.' : 'Multiplie ta valeur de f′ par 4.' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Bilan',
        rendre(api) {
          const L = () => api.trouver(c => c.type === 'cv');
          const moy = BS.lignes.length ? BS.lignes.reduce((a, l) => a + l.f, 0) / BS.lignes.length : null;
          api.bloc(api.g, `<div class="cle"><p><b>Méthode de Bessel.</b> Objet et écran fixes à la distance D ≥ 4f′ ; deux positions de la lentille donnent une image nette, distantes de d. Alors f′ = (D² − d²) / (4D).</p></div>
            <p>Plus précise que l'autocollimation : on mesure d, l'écart entre deux positions, et on refait la mesure pour plusieurs D.</p>`);
          api.question(api.d, { parties: [
            api.manip({
              q: 'Choisis la lentille sur le banc et clique sur « Révéler » pour comparer avec ta mesure.',
              attente: 'En attente de « Révéler »…',
              test: () => !!L().revele,
              montrer() { L().revele = true; api.choisir(L()); },
              get solution() { return `<p>f′ = ${fmtF(L().f)} cm${moy != null ? ` : tes mesures donnent ${fmt(moy, 1)} cm en moyenne` : ''}.</p>`; },
            }),
          ] }, () => api.continuer(api.d));
        },
      },
    ],
  };

  /* ============================================================
     TP 4 : LUNETTE ASTRONOMIQUE
     ============================================================ */
  const LU = { hp: null, h: null };
  const F0 = 20, F1 = 50, F2 = 10, FO = 5;               // collimateur, objectif, oculaire, cristallin de l'œil (cm)
  // modèle de l'œil : lentille L₃ (f′ = 5 cm) et écran (rétine) dans son plan focal image
  const cristallin = api => api.trouver(c => c.type === 'cv' && c.f === FO && c.nom !== 'L₁' && c.nom !== 'L₂');
  const retine = api => { const c = cristallin(api); return c ? ecrans(api).find(e => Math.abs(e.x - c.x - FO) <= 0.3) || null : null; };
  // place l'œil (lentille L₃ puis écran 5 cm derrière), en les ajoutant s'il le faut
  function placerOeil(api, x) {
    let c = cristallin(api);
    if (!c) c = api.ajouter({ type: 'cv', f: FO, D: 3, nom: 'L₃', verrou: { f: true } }, x);
    let e = retine(api) || ecrans(api).find(o => o.x > c.x) || api.comps().find(o => o.type === 'ecran');
    if (!e) e = api.ajouter({ type: 'ecran' }, x + FO);
    e.retire = false;
    api.placer(e, BO.etat.L);                   // écarte l'écran le temps de placer la lentille
    api.placer(c, x);
    api.placer(e, c.x + FO);
  }
  BO.TP.lunette = {
    menu: 'TP : lunette astronomique', titre: 'Lunette astronomique', banc: 150,
    montage() {
      LU.hp = null; LU.h = null;
      return [{ type: 'lampe', x: 0, AB: 0.6, verrou: { suppr: true } },
        { type: 'cv', x: 32, f: F0, D: 4, nom: 'L₀', verrou: { f: true, suppr: true } }];
    },
    etapes: [
      {
        titre: 'Objet à l\'infini',
        rendre(api) {
          api.bloc(api.g, `<p>Une lunette astronomique sert à observer des objets très éloignés, « à l'infini ». On fabrique un tel objet avec la lentille <b>L₀</b> (f′₀ = ${F0} cm, imposée) : l'image de la lettre F par L₀ doit être à l'infini.</p>
            <p>Coche « Rayons » : les rayons issus d'un même point de l'objet doivent sortir de L₀ parallèles entre eux.</p>`);
          const L0 = () => api.trouver(c => c.nom === 'L₀');
          api.question(api.d, { parties: [
            { type: 'choix', q: 'Où faut-il placer l\'objet AB pour que son image par L₀ soit à l\'infini ?', melanger: false, colonne: true,
              options: [{ id: 'a', label: `Dans le plan focal objet de L₀, à ${F0} cm avant L₀` }, { id: 'b', label: 'Dans le plan focal image de L₀' }, { id: 'c', label: 'Très loin de L₀' }], bonne: 'a',
              indices: { b: 'Le foyer image F′₀ est après la lentille ; l\'objet, lui, est avant.', c: 'Un objet très loin donne une image dans le plan focal image, à distance finie.' } },
            api.manip({
              q: `Place L₀ à ${F0},0 cm de l'objet.`,
              test() { const l = lampe(api); return Math.abs(L0().x - l.x - F0) < 0.05; },
              montrer() { const l = lampe(api); api.placer(L0(), l.x + F0); },
              solution: '<p>Les rayons issus de A sortent de L₀ parallèles à l\'axe, ceux issus de B parallèles entre eux : l\'objet est vu « à l\'infini ».</p>',
            }),
            { type: 'nombre', q: 'L\'objet mesure AB = 0,6 cm. Calcule l\'angle α = AB / f′₀ sous lequel on le voit.', label: 'α =', unite: 'rad' + CALC, rel: 0.02, signe: false,
              valeur: 0.6 / F0,
              diag: v => Math.abs(v - F0 / 0.6) < 1 ? 'Tu as calculé f′₀ / AB : c\'est AB / f′₀.' : 'α = 0,6 / 20, en radians (les deux longueurs en cm).' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Objectif et oculaire',
        rendre(api) {
          api.bloc(api.g, `<p>La lunette est formée de deux lentilles convergentes de la boîte : <b>f′ = ${F1} cm</b> et <b>f′ = ${F2} cm</b>. L'<b>objectif</b> est tourné vers l'objet, l'<b>oculaire</b> vers l'œil.</p>`);
          const L0 = () => api.trouver(c => c.nom === 'L₀');
          const obj = () => api.trouver(c => c.type === 'cv' && c.f === F1 && c.nom === 'L₁');
          const ocu = () => api.trouver(c => c.type === 'cv' && c.f === F2 && c.nom === 'L₂');
          api.question(api.d, { parties: [
            { type: 'choix', q: 'Laquelle sert d\'objectif ?', melanger: false, colonne: true,
              options: [{ id: 'a', label: `La lentille de f′ = ${F1} cm (grande distance focale)` }, { id: 'b', label: `La lentille de f′ = ${F2} cm (petite distance focale)` }], bonne: 'a',
              indices: { b: 'L\'objectif forme une grande image intermédiaire : il a une grande distance focale. L\'oculaire, de petite distance focale, sert de loupe pour regarder cette image.' } },
            {
              type: 'perso', aide: true,
              q: `Ajoute les deux lentilles, puis place l'<b>objectif</b> de 12 à 20 cm après L₀ et l'<b>oculaire</b> après l'objectif.`,
              monter(zone, p) {
                const box = document.createElement('div');
                box.className = 'bo-btns';
                box.innerHTML = `<button type="button" class="btn-small" data-f="${F1}">+ Lentille L₁, f′ = ${F1} cm</button><button type="button" class="btn-small" data-f="${F2}">+ Lentille L₂, f′ = ${F2} cm</button>`;
                zone.appendChild(box);
                const att = document.createElement('p');
                att.className = 'bo-attente';
                att.innerHTML = '<span class="bo-pt" aria-hidden="true"></span>En attente de ta manipulation sur le banc…';
                zone.appendChild(att);
                const maj = () => {
                  box.querySelector(`[data-f="${F1}"]`).disabled = !!obj();
                  box.querySelector(`[data-f="${F2}"]`).disabled = !!ocu();
                };
                box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
                  const f = +b.dataset.f, x0 = L0().x;
                  const c = api.ajouter({ type: 'cv', f, D: 4, nom: f === F1 ? 'L₁' : 'L₂', verrou: { f: true } }, f === F1 ? x0 + 45 : x0 + 90);
                  if (c) api.choisir(c);
                }));
                let fini = false;
                const ok = () => obj() && ocu() && obj().x - L0().x >= 12 && obj().x - L0().x <= 20 && ocu().x > obj().x;
                const verif = () => { maj(); if (!fini && !p.fini() && ok()) { fini = true; att.remove(); box.remove(); p.reussi(); } };
                api.surChange(verif);
                setTimeout(verif, 0);
                return {
                  montrer() {
                    fini = true; att.remove(); box.remove();
                    const x0 = L0().x;
                    if (!obj()) api.ajouter({ type: 'cv', f: F1, D: 4, nom: 'L₁', verrou: { f: true } }, x0 + 15);
                    if (!ocu()) api.ajouter({ type: 'cv', f: F2, D: 4, nom: 'L₂', verrou: { f: true } }, x0 + 85);
                    api.placer(obj(), x0 + 15);
                    if (ocu().x <= obj().x) api.placer(ocu(), obj().x + 70);
                  },
                };
              },
              solution: `<p>Objectif L₁ (f′₁ = ${F1} cm) près de L₀, oculaire L₂ (f′₂ = ${F2} cm) plus loin.</p>`,
            },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Image intermédiaire',
        rendre(api) {
          const obj = () => api.trouver(c => c.nom === 'L₁'), ocu = () => api.trouver(c => c.nom === 'L₂');
          if (!obj() || !ocu()) { api.bloc(api.g, '<p>Place d\'abord l\'objectif et l\'oculaire (étape 2).</p>'); return; }
          api.bloc(api.g, `<p>Ajoute un <b>écran</b> entre l'objectif et l'oculaire, et cherche l'image intermédiaire A₁B₁ <b>nette</b>.</p>`);
          const ecranEntre = () => ecrans(api).find(e => e.x > obj().x && e.x < ocu().x) || null;
          api.question(api.d, { parties: [
            api.manip({
              q: 'Image intermédiaire A₁B₁ nette sur un écran, entre l\'objectif et l\'oculaire.',
              test() { const e = ecranEntre(); const t = e && api.cible(e); return !!(t && t.nette); },
              montrer() {
                if (ocu().x < obj().x + F1 + 3) api.placer(ocu(), obj().x + F1 + F2 + 8);
                const e = api.comps().find(c => c.type === 'ecran') || api.ajouter({ type: 'ecran' }, obj().x + F1);
                e.retire = false; api.placer(e, obj().x + F1);
              },
            }),
            { type: 'choix', q: 'Où se forme l\'image intermédiaire A₁B₁ ?', melanger: false, colonne: true,
              options: [{ id: 'a', label: 'Dans le plan focal image de l\'objectif' }, { id: 'b', label: 'Dans le plan focal objet de l\'objectif' }, { id: 'c', label: 'Contre l\'oculaire' }], bonne: 'a',
              indices: { b: 'L\'objet est à l\'infini : son image se forme dans le plan focal IMAGE de l\'objectif, après lui.', c: 'Lis les positions : l\'écran est à 50 cm de l\'objectif, soit f′₁.' } },
            { type: 'nombre', q: 'Mesure la taille de l\'image intermédiaire (vue de l\'écran, clique dessus pour l\'agrandir).', label: 'A₁B₁ =', unite: 'cm', tol: 0.1, signe: false,
              valeur: F1 * 0.6 / F0,
              diag: () => 'Sur la règle de la vue, lis de l\'axe (0) jusqu\'au bout de la lettre.' },
            api.manip({
              q: `Lunette afocale : place l'oculaire pour que son foyer objet F₂ soit sur A₁B₁ (à ${F2} cm de l'écran), puis retire l'écran du faisceau.`,
              test() { return Math.abs(ocu().x - obj().x - F1 - F2) < 0.1 && !ecranEntre(); },
              montrer() { api.placer(ocu(), obj().x + F1 + F2); const e = ecranEntre(); if (e) e.retire = true; api.changer(); },
              solution: '<p>F′₁ et F₂ sont confondus : la lunette est <b>afocale</b>. L\'image définitive est à l\'infini : l\'œil l\'observe sans fatigue.</p>',
            }),
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'L\'œil',
        rendre(api) {
          const ocu = () => api.trouver(c => c.nom === 'L₂');
          if (!ocu()) { api.bloc(api.g, '<p>Place d\'abord l\'objectif et l\'oculaire (étape 2).</p>'); return; }
          api.bloc(api.g, `<p>On modélise l'œil comme sur un vrai montage : une <b>lentille convergente f′ = ${FO} cm</b> (le cristallin) et un <b>écran</b> (la rétine) placé dans son plan focal image, ${FO} cm derrière. Cet « œil » voit net les objets à l'infini.</p>
            <p>Ajoute la lentille avec le bouton ci-dessous, et l'écran avec la barre d'outils.</p>`);
          const bt = api.bloc(api.g, `<button type="button" class="btn-small">+ Lentille L₃, f′ = ${FO} cm (cristallin)</button>`, 'bo-btns');
          const b = bt.querySelector('button');
          const maj = () => { b.disabled = !!cristallin(api); };
          b.addEventListener('click', () => { const c = api.ajouter({ type: 'cv', f: FO, D: 3, nom: 'L₃', verrou: { f: true } }, ocu().x + 12); if (c) api.choisir(c); });
          api.surChange(maj); maj();
          api.question(api.d, { parties: [
            api.manip({
              q: `Place la lentille L₃ derrière l'oculaire et l'écran à ${FO} cm derrière L₃ : l'image sur cet écran (la rétine) doit être nette.`,
              test() { const c = cristallin(api), r = retine(api); const t = r && api.cible(r); return c && c.x > ocu().x && t && t.nette; },
              ok() { LU.hp = Math.abs(api.cible(retine(api)).m) * lampe(api).AB; },
              montrer() { placerOeil(api, ocu().x + 12); },
              solution: '<p>L\'image sur la rétine est nette : l\'image définitive donnée par la lunette est bien à l\'infini.</p>',
            }),
            { type: 'nombre', q: 'Mesure la taille h′ de l\'image sur la rétine (vue de l\'écran, boutons − et + pour l\'échelle).', label: 'h′ =', unite: 'cm', tol: 0.05, signe: false,
              get valeur() { return LU.hp || 0.75; },
              diag: () => 'Sur la règle de la vue de la rétine, lis la hauteur de la lettre : de l\'axe (0) jusqu\'au bout de la lettre.' },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Grossissement',
        rendre(api) {
          const L0 = () => api.trouver(c => c.nom === 'L₀'), obj = () => api.trouver(c => c.nom === 'L₁');
          if (!obj() || !cristallin(api)) { api.bloc(api.g, '<p>Fais d\'abord les étapes 2 et 4 (objectif, oculaire, puis lentille L₃ et écran pour l\'œil).</p>'); return; }
          api.bloc(api.g, `<div class="cle"><p><b>Grossissement.</b> G = α′ / α : α est l'angle sous lequel on voit l'objet à l'œil nu, α′ celui sous lequel on voit son image à travers la lunette.</p></div>
            <p>Sur la rétine, la taille de l'image est proportionnelle à l'angle (h = f′<sub>œil</sub> × α) : G = h′ / h.</p>
            <p class="bo-mes" data-mes></p>`);
          const mesures = api.g.querySelector('[data-mes]');
          const majMes = () => { mesures.innerHTML = `Avec la lunette : h′ = ${fmt(LU.hp || 0.75, 2)} cm${LU.h ? ` · sans la lunette : h = ${fmt(LU.h, 2)} cm` : ''}`; };
          majMes();
          api.question(api.d, { parties: [
            api.manip({
              q: 'Pour voir l\'objet à l\'œil nu (sans la lunette), place la lentille L₃ et son écran entre L₀ et l\'objectif.',
              test() { const c = cristallin(api), r = retine(api), t = r && api.cible(r); return c && c.x > L0().x && r.x < obj().x && t && t.nette; },
              ok() { LU.h = Math.abs(api.cible(retine(api)).m) * lampe(api).AB; majMes(); },
              montrer() { placerOeil(api, L0().x + 1.5); },
            }),
            { type: 'nombre', q: 'Mesure la taille h de l\'image sur la rétine, sans la lunette.', label: 'h =', unite: 'cm', tol: 0.03, signe: false,
              get valeur() { return LU.h || 0.15; },
              diag: () => 'Lis la hauteur de la lettre sur la règle de la vue de la rétine (bouton + pour agrandir l\'échelle : la règle est graduée en millimètres).' },
            { type: 'nombre',
              get q() { return `Calcule le grossissement G = h′ / h, avec h′ = ${fmt(LU.hp || 0.75, 2)} cm (avec la lunette) et h = ${fmt(LU.h || 0.15, 2)} cm (à l'œil nu).`; },
              label: 'G = h′ / h =', unite: CALC, tol: 0.3, signe: false,
              get valeur() { return (LU.hp || 0.75) / (LU.h || 0.15); },
              diag: v => Math.abs(v - 1 / ((LU.hp || 0.75) / (LU.h || 0.15))) < 0.05 ? 'Tu as calculé h / h′ : G = h′ / h (avec la lunette / à l\'œil nu).' : `G = h′ / h = ${fmt(LU.hp || 0.75, 2)} / ${fmt(LU.h || 0.15, 2)}.` },
            { type: 'nombre', q: 'Calcule f′₁ / f′₂ (objectif / oculaire).', label: 'f′₁ / f′₂ =', unite: '', tol: 0.01, signe: false,
              valeur: F1 / F2,
              diag: () => `f′₁ = ${F1} cm (objectif), f′₂ = ${F2} cm (oculaire).`,
              solution: `<p>G = f′₁ / f′₂ = ${F1} / ${F2} = ${F1 / F2} : on retrouve le grossissement mesuré.</p>` },
          ] }, () => api.continuer(api.d));
        },
      },
      {
        titre: 'Cercle oculaire',
        rendre(api) {
          const obj = () => api.trouver(c => c.nom === 'L₁'), ocu = () => api.trouver(c => c.nom === 'L₂');
          if (!obj() || !ocu()) { api.bloc(api.g, '<p>Place d\'abord l\'objectif et l\'oculaire (étape 2).</p>'); return; }
          // cercle oculaire : image de la monture de l'objectif par l'oculaire
          const co = () => { const d = ocu().x - obj().x; return ocu().x + F2 * d / (d - F2); };
          api.bloc(api.g, `<div class="cle"><p><b>Cercle oculaire.</b> C'est l'image de la monture de l'objectif donnée par l'oculaire. Toute la lumière qui traverse la lunette passe par ce petit disque : c'est là qu'on place l'œil.</p></div>
            <p>Enlève l'œil du trajet de la lumière : supprime la lentille L₃ (ou mets-la au bout du banc) et déplace son écran <b>derrière l'oculaire</b>. Cherche la position où la tache lumineuse est la plus petite.</p>`);
          // construction : deux rayons issus de chaque bord de la monture de l'objectif (une couleur par bord)
          const construction = () => {
            const xo = obj().x, xc = ocu().x, R = obj().D / 2, xF = xc + F2, xe = co() + 12;
            const t = [];
            for (const s of [1, -1]) {
              const y = s * R, cls = s > 0 ? 's-trace-h' : 's-trace-b';
              t.push({ pts: [[xo, y], [xe, y + (-y / (xc - xo)) * (xe - xo)]], cls });          // par le centre de l'oculaire
              t.push({ pts: [[xo, y], [xc, y], [xe, y - y / F2 * (xe - xc)]], cls });             // parallèle à l'axe, puis par F′₂
            }
            const yc = obj().D / 2 * F2 / (ocu().x - obj().x - F2);
            t.push({ pts: [[co(), -yc], [co(), yc]], cls: 's-trace-co' });
            return t;
          };
          const bt = api.bloc(api.g, '<button type="button" class="btn-small" aria-pressed="false">Afficher la construction du cercle oculaire</button>', 'bo-btns');
          const b = bt.querySelector('button');
          let vu = false;
          const montrerConstr = on => { vu = on; api.traces(on ? construction : null); b.setAttribute('aria-pressed', on); b.textContent = on ? 'Masquer la construction' : 'Afficher la construction du cercle oculaire'; };
          b.addEventListener('click', () => montrerConstr(!vu));
          const ecranCO = () => ecrans(api).find(e => e.x > ocu().x && Math.abs(e.x - co()) <= 0.3 && api.cible(e) && api.cible(e).lumiere
            && !api.comps().some(c => c.type === 'cv' && c.x > ocu().x && c.x < e.x)) || null;
          let mes = null;
          api.question(api.d, { parties: [
            api.manip({
              q: 'Écran au cercle oculaire : tache lumineuse la plus petite.',
              test: () => !!ecranCO(),
              ok() { const e = ecranCO(); mes = { x: e ? e.x : co() }; montrerConstr(true); },
              montrer() {
                // l'œil (lentille L₃ et son écran) ne doit plus couper la lumière : on garde son écran pour le cercle oculaire
                const r = retine(api), c = cristallin(api);
                if (c) api.supprimer(c);
                const e = r || ecrans(api).find(x => x.x > ocu().x) || api.ajouter({ type: 'ecran' }, co());
                ecrans(api).filter(x => x !== e && x.x < ocu().x && x.x > lampe(api).x).forEach(x => { x.retire = true; });
                api.placer(e, co());
              },
              solution: '<p>Construction tracée sur le banc : les rayons issus des bords de l\'objectif se croisent, après l\'oculaire, au cercle oculaire.</p>',
            }),
            { type: 'nombre', q: 'À quelle distance de l\'oculaire se trouve le cercle oculaire ?', label: 'distance =', unite: 'cm', tol: 0.3, signe: false,
              get valeur() { return (mes ? mes.x : co()) - ocu().x; },
              diag: () => 'Différence entre la position de l\'écran et celle de l\'oculaire.' },
            { type: 'nombre', q: 'Mesure le diamètre du cercle oculaire (vue de l\'écran).', label: 'diamètre =', unite: 'cm', tol: 0.1, signe: false,
              get valeur() { return obj().D * F2 / F1; },
              diag: v => Math.abs(v - obj().D * F2 / F1 / 2) < 0.06 ? 'C\'est le rayon : lis d\'un bord à l\'autre du disque.' : 'Bouton + de la vue pour agrandir l\'échelle, puis lis la règle d\'un bord à l\'autre du disque lumineux.',
              solution: `<p>Le cercle oculaire est beaucoup plus petit que l'objectif (Ø ${fmtF(obj().D)} cm) : toute la lumière entrée dans l'objectif y est concentrée.</p>` },
            { type: 'choix', q: 'Pourquoi place-t-on l\'œil au cercle oculaire ?', melanger: false, colonne: true,
              options: [{ id: 'a', label: 'Toute la lumière qui sort de la lunette y passe : l\'œil en reçoit le plus' }, { id: 'b', label: 'C\'est le seul endroit où l\'image est nette' }, { id: 'c', label: 'C\'est le foyer image de l\'oculaire' }], bonne: 'a',
              indices: { b: 'L\'image définitive est à l\'infini : l\'œil la voit nette à toute distance derrière l\'oculaire. Le cercle oculaire concerne la lumière reçue.', c: `Le cercle oculaire est un peu plus loin que F′₂ (${fmtF(F2)} cm) : c'est l'image de la monture de l'objectif.` } },
          ] }, () => api.continuer(api.d));
        },
      },
    ],
  };
})();
