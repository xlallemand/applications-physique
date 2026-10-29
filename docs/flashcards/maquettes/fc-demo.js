/* ============================================================
   MAQUETTE — moteur de démonstration des flashcards (objet FC)
   Données d'exemple : les cartes du chapitre 11 (changements-etat),
   avec un état fictif (case, date de prochaine révision, sens).
   Rien n'est enregistré : tout repart à zéro au rechargement.

   FC.face(carte, sens, cote)     HTML d'une face (recto / verso)
   FC.boite(cartes, o)            boîte à cases (vue « paquets »)
   FC.jours(cartes)               cartes à réviser les 7 prochains jours
   FC.seance(zone, cartes, o)     séance de révision interactive
   FC.paquets(zone)               liste des cartes de l'application, par paquet
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Planning : 7 cases, puis « maîtrisée » ---------- */
  const INTERVALLES = [1, 2, 4, 7, 14, 30, 60];                   // jours avant la révision suivante, case 1 à 7
  const COURT = ['1 j', '2 j', '4 j', '7 j', '14 j', '30 j', '60 j'];
  const LONG = ['1 jour', '2 jours', '4 jours', '1 semaine', '2 semaines', '1 mois', '2 mois'];
  const MAX = INTERVALLES.length;
  const TYPES = { definition: 'Définition', formule: 'Formule', savoir: 'À savoir', schema: 'Schéma', graphique: 'Lecture graphique', methode: 'Méthode', reflexe: 'Réflexe' };
  const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const jour = n => { const d = new Date(auj); d.setDate(d.getDate() + n); return d; };
  const date = n => { const d = jour(n); return `${JOURS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const dans = n => (n < 0 ? `en retard de ${-n} j` : n === 0 ? 'aujourd\'hui' : n === 1 ? 'demain' : `dans ${n} j`);
  const val = x => (typeof x === 'function' ? x() : x);

  /* ---------- Figures (dessinées par le moteur de l'application, CE) ---------- */
  const ce = () => window.CE;
  const fig = h => `<div class="fc-fig">${h}</div>`;
  const transitionsNumerotees = () => {
    let s = ce().dessin('transitions');
    ['fusion', 'solidification', 'sublimation', 'condensation', 'vaporisation', 'liquéfaction'].forEach((m, i) => { s = s.replace('>' + m + '<', '>' + '①②③④⑤⑥'[i] + '<'); });
    return s;
  };
  const UC = 'J·kg<sup>−1</sup>·K<sup>−1</sup>', UL = 'J·kg<sup>−1</sup>';

  /* ---------- Cartes du chapitre 11 (paquet = un cours) ---------- */
  // faces : une face = { q, r } ; deux faces = révisée dans les deux sens, en alternance
  // e : état fictif { c : case (0 = pas encore ajoutée, 8 = maîtrisée), d : dans combien de jours, s : sens de la prochaine révision }
  const PAQUETS = [
    { id: 'm1', module: 1, titre: 'États de la matière et liaison hydrogène', apres: 'Cours du module 1', ajoute: -12, cartes: [
      { id: 'ce-1-etats', type: 'savoir', faces: [{
        q: 'Comment sont organisées les molécules dans un solide, un liquide et un gaz ?',
        r: () => fig(ce().dessin('micro', { ordre: ['s', 'l', 'g'], noms: true })) + '<p><b>Solide</b> : serrées et rangées. <b>Liquide</b> : serrées, en désordre. <b>Gaz</b> : très éloignées les unes des autres.</p>' }],
        e: { c: 4, d: 3 } },
      { id: 'ce-1-six', type: 'schema', faces: [{
        q: () => 'Nomme les six changements d\'état numérotés.' + fig(transitionsNumerotees()),
        r: () => fig(ce().dessin('transitions')) + '<p>① fusion · ② solidification · ③ sublimation · ④ condensation · ⑤ vaporisation · ⑥ liquéfaction</p>' }],
        e: { c: 3, d: 0 } },
      { id: 'ce-1-subli', type: 'definition', faces: [
        { q: 'Sublimation : de quel état à quel état ? Comment s\'appelle la transformation inverse ?', r: '<p>Du <b>solide</b> au <b>gaz</b>, directement.</p><p>Inverse : la <b>condensation</b> (gaz → solide).</p>' },
        { q: 'Comment s\'appelle le passage direct du solide au gaz ?', r: '<p>La <b>sublimation</b>. Inverse : la condensation.</p>' }],
        e: { c: 3, d: 2, s: 1 } },
      { id: 'ce-1-L', type: 'definition', faces: [
        { q: 'Qu\'est-ce que la chaleur latente L ? Quelle est son unité ?', r: `<p>L'énergie qu'il faut pour faire <b>changer d'état 1 kg</b> d'un corps pur.</p><p class="fc-unites">L en ${UL}</p>` },
        { q: 'Comment s\'appelle l\'énergie nécessaire pour faire changer d\'état 1 kg d\'un corps pur ? Symbole, unité ?', r: `<p>La <b>chaleur latente L</b>, en ${UL}.</p>` }],
        e: { c: 4, d: 0, s: 1 } },
      { id: 'ce-1-signeL', type: 'savoir', faces: [{
        q: 'Signe de L pour une fusion, une vaporisation, une sublimation ? Et pour les transformations inverses ?',
        r: '<p><b>L &gt; 0</b> (le corps reçoit de l\'énergie) : fusion, vaporisation, sublimation.</p><p><b>L &lt; 0</b> (il en cède) : solidification, liquéfaction, condensation.</p><p class="fc-formule">L<sub>solidification</sub> = −L<sub>fusion</sub></p>' }],
        e: { c: 2, d: -1 } },
      { id: 'ce-1-liaisonH', type: 'definition', faces: [
        { q: 'Qu\'est-ce qu\'une liaison hydrogène entre deux molécules d\'eau ?', r: () => fig(ce().dessin('liaisonH', { rep: 1, legende: true })) + '<p>Elle relie un <b>H (δ<sup>+</sup>)</b> d\'une molécule au <b>O (2δ<sup>−</sup>)</b> d\'une <b>autre</b> molécule (pointillés).</p>' },
        { q: () => fig(ce().dessin('liaisonH', { rep: 1 })) + 'Comment s\'appelle la liaison en pointillés ? Entre quels atomes ?', r: '<p><b>Liaison hydrogène</b> : entre un H (δ<sup>+</sup>) d\'une molécule et le O (2δ<sup>−</sup>) d\'une autre molécule.</p>' }],
        e: { c: 3, d: 1 } },
      { id: 'ce-1-conseq', type: 'savoir', faces: [{
        q: 'Deux conséquences des liaisons hydrogène dans l\'eau ?',
        r: '<p>La glace est <b>moins dense</b> que l\'eau liquide : les glaçons flottent.</p><p>Un filet d\'eau est <b>dévié</b> par une règle frottée.</p>' }],
        e: { c: 4, d: 5 } },
    ] },
    { id: 'm2a', module: 2, titre: 'Lire le diagramme d\'état', apres: 'Cours : lire le diagramme d\'état', ajoute: -6, cartes: [
      { id: 'ce-2-zones', type: 'schema', faces: [{
        q: () => 'Place les zones solide, liquide et gaz. Quelle astuce permet de s\'en souvenir ?' + fig(ce().figDiag({ noms: false })),
        r: () => fig(ce().figDiag({})) + '<p>P augmente → état plus <b>ordonné</b> ; T augmente → état plus <b>désordonné</b>. Solide en haut à gauche, gaz en bas à droite, liquide entre les deux.</p>' }],
        e: { c: 2, d: 0 } },
      { id: 'ce-2-triple', type: 'definition', faces: [
        { q: 'Qu\'est-ce que le point triple ?', r: '<p>Le point où les <b>trois états coexistent</b>. Pour l\'eau : proche de 0 bar et 0 °C.</p>' },
        { q: 'Comment s\'appelle le point du diagramme où les trois états coexistent ?', r: '<p>Le <b>point triple</b>.</p>' }],
        e: { c: 3, d: 2, s: 1 } },
      { id: 'ce-2-critique', type: 'definition', faces: [
        { q: 'Qu\'est-ce que le point critique ?', r: '<p>La <b>fin de la courbe de vaporisation</b> : au-delà, plus de distinction entre liquide et gaz.</p>' },
        { q: 'Comment s\'appelle le point qui termine la courbe de vaporisation ?', r: '<p>Le <b>point critique</b>.</p>' }],
        e: { c: 1, d: 0 } },
      { id: 'ce-2-lire', type: 'graphique', faces: [{
        q: () => 'Dans quel état est l\'eau à 50 °C et 0,06 bar ?' + fig(ce().figDiag({ points: [{ T: 50, P: .06, nom: 'A' }], noms: false })),
        r: () => fig(ce().figDiag({ points: [{ T: 50, P: .06, nom: 'A' }], zone: 'g' })) + '<p><b>Gaz</b> : le point A est dans la zone en bas à droite, sous la courbe de vaporisation.</p>' }],
        e: { c: 2, d: 1 } },
      { id: 'ce-2-courbe', type: 'savoir', faces: [{
        q: 'Que se passe-t-il pour un point situé sur une courbe du diagramme d\'état ?',
        r: '<p><b>Deux états coexistent</b> : solide et liquide sur la courbe de fusion, liquide et gaz sur la courbe de vaporisation, solide et gaz sur la courbe de sublimation.</p>' }],
        e: { c: 3, d: 3 } },
    ] },
    { id: 'm2b', module: 2, titre: 'Changement d\'état et pression', apres: 'Cours : changement d\'état et pression', ajoute: -5, cartes: [
      { id: 'ce-2-fleche', type: 'methode', faces: [{
        q: 'Comment trouver, sur le diagramme d\'état, les températures de changement d\'état à une pression donnée ?',
        r: () => fig(ce().figDiag({ fleche: { P: 1, T1: -10, T2: 120, etiquettes: ['0 °C', '100 °C'] } })) + '<ol><li>Tracer une <b>flèche horizontale</b> à cette pression.</li><li>Ses <b>croisements</b> avec les courbes donnent les températures de fusion et de vaporisation.</li></ol>' }],
        e: { c: 2, d: 1 } },
      { id: 'ce-2-pression', type: 'savoir', faces: [{
        q: 'Comment la température d\'ébullition de l\'eau varie-t-elle avec la pression ? Un exemple ?',
        r: '<p>Plus la pression est <b>grande</b>, plus la température de vaporisation est <b>grande</b>.</p><p>Cocotte-minute (2 bar) : vers 120 °C ; à 0,5 bar : vers 81 °C.</p>' }],
        e: { c: 1, d: -2 } },
      { id: 'ce-2-lirePT', type: 'graphique', faces: [{
        q: () => 'Lis la température d\'ébullition de l\'eau à 2 bar.' + fig(ce().figPT('eau', {})),
        r: () => fig(ce().figPT('eau', { lecture: { P: 2 }, valeur: true })) + '<p>Environ <b>120 °C</b> : on part de 2 bar sur l\'axe vertical, on rejoint la courbe, on descend sur l\'axe des températures.</p>' }],
        e: { c: 2, d: 2 } },
      { id: 'ce-2-relative', type: 'definition', faces: [
        { q: 'Qu\'est-ce qu\'une pression relative ?', r: '<p>Une pression mesurée <b>par rapport à la pression atmosphérique</b>.</p>' },
        { q: 'Comment s\'appelle une pression mesurée par rapport à la pression atmosphérique ?', r: '<p>Une <b>pression relative</b>.</p>' }],
        e: { c: 2, d: 0, s: 1 } },
    ] },
    { id: 'm3', module: 3, titre: 'Énergie et changement de température', apres: 'Cours du module 3', ajoute: -2, cartes: [
      { id: 'ce-3-formule', type: 'formule', faces: [
        { q: 'Énergie Q reçue par un corps de masse m qui passe de T<sub>i</sub> à T<sub>f</sub> sans changer d\'état ?<small>Formule et unités</small>',
          r: `<p class="fc-formule">Q = m × c × (T<sub>f</sub> − T<sub>i</sub>)</p><p class="fc-unites">Q en J · m en kg · c en ${UC}</p>` },
        { q: '<span class="fc-formule" style="display:block">Q = m × c × (T<sub>f</sub> − T<sub>i</sub>)</span>Que calcule-t-on ? Que représente chaque lettre ?',
          r: `<p>L'énergie <b>reçue (Q &gt; 0) ou cédée (Q &lt; 0)</b> par un corps qui change de température <b>sans changer d'état</b>.</p><p>m : masse (kg) · c : capacité thermique massique (${UC}) · T<sub>i</sub>, T<sub>f</sub> : températures initiale et finale.</p>` }],
        e: { c: 1, d: 0 } },
      { id: 'ce-3-c', type: 'definition', faces: [
        { q: 'Capacité thermique massique c : unité ? Dépend-elle de l\'état ?', r: `<p>c en <b>${UC}</b> (ou J·kg<sup>−1</sup>·°C<sup>−1</sup>).</p><p>Elle <b>dépend de l'état</b> : eau 4 180, glace 2 090, vapeur 2 010 ${UC}.</p>` },
        { q: `Comment s'appelle la grandeur c de Q = m c ΔT ? Unité ?`, r: `<p>La <b>capacité thermique massique</b>, en ${UC}.</p>` }],
        e: { c: 1, d: 1 } },
      { id: 'ce-3-signe', type: 'savoir', faces: [{
        q: 'Que signifie le signe de Q ?',
        r: '<p><b>Q &gt; 0</b> : le corps <b>reçoit</b> de l\'énergie, il chauffe.</p><p><b>Q &lt; 0</b> : il <b>cède</b> de l\'énergie, il refroidit.</p>' }],
        e: { c: 2, d: 2 } },
      { id: 'ce-3-reflexe', type: 'reflexe', faces: [{
        q: '250 g de glace, c = 2,09 kJ·kg<sup>−1</sup>·K<sup>−1</sup>, de −20 °C à 0 °C. Que vérifies-tu avant de calculer Q ?',
        r: `<ol><li>m en kg : <b>0,250 kg</b>.</li><li>c en J : <b>2 090 ${UC}</b>.</li><li>Températures négatives : T<sub>f</sub> − T<sub>i</sub> = 0 − (−20) = <b>20</b>.</li></ol>` }],
        e: { c: 1, d: 1 } },
    ] },
    { id: 'm4', module: 4, titre: 'Énergie et changement d\'état', apres: 'Cours du module 4', coursFait: true, cartes: [
      { id: 'ce-4-formule', type: 'formule', faces: [
        { q: 'Énergie Q pour faire changer d\'état une masse m d\'un corps pur ?<small>Formule et unités</small>', r: `<p class="fc-formule">Q = m × L</p><p class="fc-unites">Q en J · m en kg · L en ${UL}</p>` },
        { q: '<span class="fc-formule" style="display:block">Q = m × L</span>Que calcule-t-on ? Que représente chaque lettre ?', r: `<p>L'énergie pour faire <b>changer d'état</b> la masse m, à température constante.</p><p>m : masse (kg) · L : chaleur latente (${UL}).</p>` }],
        e: { c: 0 } },
      { id: 'ce-4-palier', type: 'graphique', faces: [{
        q: () => 'Que montrent les paliers de cette courbe ?' + fig(ce().dessin('palier')),
        r: '<p>Des <b>changements d\'état</b> : pendant le changement d\'état d\'un corps pur, la <b>température reste constante</b>. Eau à 1 bar : fusion à 0 °C, ébullition à 100 °C.</p>' }],
        e: { c: 0 } },
      { id: 'ce-4-astuce', type: 'savoir', faces: [{
        q: 'Quelle astuce permet de trouver le signe de L ?',
        r: '<p>Vers un état <b>plus désordonné</b> (besoin d\'énergie) : <b>L &gt; 0</b>. Vers un état plus ordonné : <b>L &lt; 0</b>.</p><p>Transformation inverse : même valeur, signe opposé.</p>' }],
        e: { c: 0 } },
      { id: 'ce-4-unites', type: 'reflexe', faces: [{
        q: 'L est donnée en kJ·kg<sup>−1</sup> et m en g. Que fais-tu avant de calculer Q = m L ?',
        r: `<p>L × 10<sup>3</sup> pour l'avoir en ${UL}, et m en kg (÷ 1 000).</p><p>Ou bien : L en J·g<sup>−1</sup> et m en g.</p>` }],
        e: { c: 0 } },
    ] },
    { id: 'm5', module: 5, titre: 'La méthode du schéma des étapes', apres: 'Cours : une ou deux étapes', cartes: [
      { id: 'ce-5-methode', type: 'methode', faces: [{
        q: 'Méthode du schéma des étapes : que fais-tu, dans l\'ordre ?',
        r: '<ol><li>Une <b>bulle</b> par état et par température (état, température, pression si besoin).</li><li>Une <b>flèche</b> par étape : Q<sub>1</sub>, Q<sub>2</sub>…</li><li>Pour chaque flèche : <b>Q = m c ΔT</b> (même état) ou <b>Q = m L</b> (même température).</li><li><b>Q = Q<sub>1</sub> + Q<sub>2</sub> + …</b></li></ol>' }],
        e: { c: 0 } },
      { id: 'ce-5-choix', type: 'savoir', faces: [{
        q: 'Quelle formule pour une flèche entre deux bulles de même état ? Entre deux états différents ?',
        r: '<table class="fc-tab"><tr><th>entre deux bulles…</th><th>formule</th></tr><tr><td>même état, températures différentes</td><td>Q = m c<sub>état</sub> (T<sub>f</sub> − T<sub>i</sub>)</td></tr><tr><td>états différents, même température</td><td>Q = m L</td></tr></table>' }],
        e: { c: 0 } },
      { id: 'ce-5-schema', type: 'methode', faces: [{
        q: 'Dessine le schéma des étapes : 2,3 kg de glace à −10 °C deviennent de l\'eau liquide à 0 °C.',
        r: () => fig(ce().schemaPb(ce().resolu(ce().PROBLEMES.bac()))) + '<p>E = Q<sub>1</sub> + Q<sub>2</sub> ≈ 8,14 × 10<sup>5</sup> J</p>' }],
        e: { c: 0 } },
      { id: 'ce-5-refroid', type: 'savoir', faces: [{
        q: 'Refroidissement : quel est le signe des énergies ? Quelles chaleurs latentes utiliser ?',
        r: '<p>Toutes <b>négatives</b> : T<sub>f</sub> − T<sub>i</sub> &lt; 0, L<sub>liquéfaction</sub> = −L<sub>vap</sub>, L<sub>solidification</sub> = −L<sub>fus</sub>. Le corps cède de l\'énergie.</p>' }],
        e: { c: 0 } },
    ] },
  ];
  // chaque carte connaît son paquet
  PAQUETS.forEach(p => p.cartes.forEach(c => { c.paquet = p; c.e.s = c.e.s || 0; }));
  const toutes = () => PAQUETS.reduce((l, p) => l.concat(p.cartes), []);
  const actives = () => toutes().filter(c => c.e.c > 0);
  const dues = () => actives().filter(c => c.e.c <= MAX && c.e.d <= 0).sort((a, b) => a.e.c - b.e.c || a.e.d - b.e.d);

  // texte d'une question sans ses figures (rappel au verso, listes)
  const texteQ = q => val(q).replace(/<div class="fc-fig">[\s\S]*?<\/svg><\/div>/g, '').replace(/<div class="fc-fig"><div class="ce-fig[^"]*"[^>]*><\/div><\/div>/g, '').replace(/<small>.*?<\/small>/, '').replace(/<span class="fc-formule"[^>]*>(.*?)<\/span>/, '$1 : ');

  /* ---------- Une face de carte ---------- */
  function face(c, sens, cote, o) {
    o = o || {};
    const f = c.faces[Math.min(sens || 0, c.faces.length - 1)];
    const ou = (o.app ? 'Chapitre 11 · ' : '') + `Module ${c.paquet.module}`;
    const sensTxt = c.faces.length > 1 ? `<span class="fc-sens" title="Carte révisée dans les deux sens">⇄ ${sens + 1}/2</span>` : '';
    const tete = `<div class="fc-tete"><span class="fc-ou">${ou}</span>${sensTxt}<span class="fc-type">${TYPES[c.type]}</span></div>`;
    const pied = o.pied === false ? '' : `<div class="fc-pied"><span>${cote === 'recto' ? 'Question' : 'Réponse'}</span><span>${c.e.c > 0 && c.e.c <= MAX ? 'Case ' + c.e.c + ' · revue après ' + LONG[c.e.c - 1] : ''}</span></div>`;
    const corps = cote === 'recto'
      ? `<div class="fc-q">${val(f.q)}</div>`
      : `<div class="fc-rappel">${texteQ(f.q)}</div><div class="fc-rep">${val(f.r)}</div>`;
    return `<div class="fc-face fc-${cote}">${tete}<div class="fc-corps">${corps}</div>${pied}</div>`;
  }

  /* ---------- Boîte à cases ---------- */
  // o.nouvelles : colonne « à ajouter » (cartes pas encore dans les révisions) ; o.compte : comptes imposés (autres applications)
  function boite(cartes, o) {
    o = o || {};
    const cols = [];
    if (o.nouvelles) cols.push({ nom: '+', liste: cartes.filter(c => c.e.c === 0), cls: 'neuve', hors: true });
    for (let k = 1; k <= MAX; k++) cols.push({ nom: COURT[k - 1], liste: cartes.filter(c => c.e.c === k), k });
    cols.push({ nom: '✓', liste: cartes.filter(c => c.e.c > MAX), cls: 'ok', hors: true });
    const tas = col => col.liste.slice(0, 18).map(c => `<i class="${col.cls || (c.e.d <= 0 ? 'du' : '')}"></i>`).join('');
    return `<div class="fc-boite" style="--n:${cols.length}" role="img" aria-label="Boîte de révision : ${cols.map(c => c.nom + ' : ' + c.liste.length + ' cartes').join(', ')}">` +
      cols.map(col => {
        const n = col.liste.length, du = col.k ? col.liste.filter(c => c.e.d <= 0).length : 0;
        return `<div class="fc-case${col.hors ? ' horsboite' : ''}" title="${col.k ? 'Case ' + col.k + ' : revue après ' + LONG[col.k - 1] : col.nom}"><span class="fc-onglet">${col.nom}</span><div class="fc-tas">${tas(col)}</div><span class="fc-nb">${n}</span><span class="fc-du">${du ? du + ' auj.' : ''}</span></div>`;
      }).join('') + '</div>' +
      `<div class="fc-legende"><span class="l-du">à réviser aujourd'hui</span><span>à réviser plus tard</span>${o.nouvelles ? '<span class="l-neuve">pas encore ajoutée</span>' : ''}<span class="l-ok">sue (sortie du planning)</span></div>`;
  }

  /* ---------- 7 prochains jours ---------- */
  function jours(cartes, extra) {
    extra = extra || [0, 0, 0, 0, 0, 0, 0];
    const n = [0, 1, 2, 3, 4, 5, 6].map(j => cartes.filter(c => c.e.c > 0 && c.e.c <= MAX && (j === 0 ? c.e.d <= 0 : c.e.d === j)).length + extra[j]);
    const m = Math.max(...n, 1);
    return '<div class="fc-jours">' + n.map((v, j) => `<div class="fc-jour${j === 0 ? ' auj' : ''}"><b>${v}</b><div class="b" style="height:${Math.max(4, Math.round(v / m * 64))}px"></div><span>${j === 0 ? 'auj.' : j === 1 ? 'dem.' : date(j).slice(0, 7)}</span></div>`).join('') + '</div>';
  }

  /* ---------- Séance de révision ---------- */
  // o.libre : révision libre (le planning ne change pas) ; o.limite : cartes par séance (réglable à tout moment)
  // ratée : la carte revient à la fin de la séance ; sa case ne change qu'à la première réponse
  // téléphone : toucher la carte la retourne, la glisser à droite = je savais, à gauche = je ne savais pas
  function seance(zone, toutes, o) {
    o = o || {};
    let limite = o.limite || 20, reste = toutes.slice(), file, total, i, sues, ratees, retour = false, deja;
    const LIMITES = [5, 10, 20, 30, 0];
    function lot() {
      file = limite ? reste.splice(0, limite) : reste.splice(0);
      total = file.length; i = 0; sues = 0; ratees = 0; deja = new Set();
      afficher();
    }
    const apres = (c, ok) => {
      if (o.libre) return 'révision libre : ta boîte ne change pas';
      const k = ok ? c.e.c + 1 : Math.max(1, c.e.c - 1);
      return '→ ' + (k > MAX ? 'sortie : sue ✓' : `case ${k} · ${dans(INTERVALLES[k - 1])}`);
    };
    const reglage = () => `<label class="fc-limite">Au plus <select id="fc-limite">${LIMITES.map(n => `<option value="${n}"${n === limite ? ' selected' : ''}>${n || 'sans limite'}</option>`).join('')}</select> cartes</label>`;
    function afficher() {
      if (!file.length) return fin();
      const c = file[0], sens = c.e.s % c.faces.length, revue = deja.has(c.id);
      zone.innerHTML = `<div class="fc-seance">
        <div class="fc-haut"><a class="btn-small" href="${o.retour || 'revisions.html'}">✕ Arrêter</a><span class="fc-compte">Carte ${Math.min(i + 1, total)} / ${total}</span>${o.libre ? '<span class="fc-libre">Révision libre</span>' : reglage()}<span class="fc-score">✓ ${sues} · ✗ ${ratees}</span></div>
        <div class="fc-barre"><i style="width:${i / total * 100}%"></i></div>
        <div class="fc-scene"><div class="fc-carte">${face(c, sens, 'recto', { app: o.app })}${face(c, sens, 'verso', { app: o.app })}</div></div>
        <p class="fc-place">${revue ? '<b>Ratée tout à l\'heure</b> : on la revoit avant la fin de la séance' : !o.libre && c.e.d < 0 ? `<b>En retard de ${-c.e.d} j</b> : elle passe en priorité` : '&nbsp;'}</p>
        <div class="fc-actions une"><button type="button" class="fc-bt fc-bt-voir" data-a="voir">Voir la réponse</button></div>
        <p class="fc-clavier"><kbd>Espace</kbd> voir la réponse · <kbd>←</kbd> je ne savais pas · <kbd>→</kbd> je savais</p>
        <p class="fc-geste">Touche la carte pour la retourner</p></div>`;
      retour = false;
      zone.querySelector('[data-a="voir"]').addEventListener('click', voir);
      const sel = zone.querySelector('#fc-limite');
      if (sel) sel.addEventListener('change', () => { limite = +sel.value; reste = file.concat(reste); file = []; lot(); });
      glisser(zone.querySelector('.fc-scene'));
    }
    function voir() {
      if (retour) return;
      const c = file[0], revue = deja.has(c.id);
      zone.querySelector('.fc-carte').classList.add('retournee');
      retour = true;
      const act = zone.querySelector('.fc-actions');
      act.classList.remove('une');
      act.innerHTML = `<button type="button" class="fc-bt fc-bt-ko" data-a="ko">✗ Je ne savais pas<small>${revue ? 'on la revoit encore' : apres(c, false)}</small></button>` +
        `<button type="button" class="fc-bt fc-bt-ok" data-a="ok">✓ Je savais<small>${revue ? 'c\'est bon pour aujourd\'hui' : apres(c, true)}</small></button>`;
      act.querySelector('[data-a="ko"]').addEventListener('click', () => repondre(false));
      act.querySelector('[data-a="ok"]').addEventListener('click', () => repondre(true));
      zone.querySelector('.fc-geste').textContent = 'Glisse la carte à droite si tu savais, à gauche sinon';
    }
    function repondre(ok) {
      const c = file.shift();
      if (!deja.has(c.id)) { i++; if (ok) sues++; else ratees++; }
      if (!ok) { deja.add(c.id); file.push(c); }
      zone.style.pointerEvents = 'none';
      setTimeout(() => { zone.style.pointerEvents = ''; afficher(); }, 250);
    }
    // geste au doigt : la carte suit le doigt ; au-delà d'un tiers de sa largeur, la réponse est donnée
    function glisser(scene) {
      const carte = scene.querySelector('.fc-carte');
      let x0 = null, dx = 0;
      scene.addEventListener('click', () => { if (!retour) voir(); });
      scene.addEventListener('pointerdown', e => {
        if (!retour || e.pointerType === 'mouse') return;
        x0 = e.clientX; dx = 0; carte.style.transition = 'none';
      });
      scene.addEventListener('pointermove', e => {
        if (x0 === null) return;
        dx = e.clientX - x0;
        carte.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg) rotateY(180deg)`;
        scene.dataset.geste = dx > 40 ? 'ok' : dx < -40 ? 'ko' : '';
      });
      const lacher = () => {
        if (x0 === null) return;
        x0 = null; carte.style.transition = '';
        const w = scene.clientWidth;
        if (Math.abs(dx) > w / 3) {
          carte.style.transform = `translateX(${Math.sign(dx) * w * 1.4}px) rotate(${Math.sign(dx) * 18}deg) rotateY(180deg)`;
          setTimeout(() => repondre(dx > 0), 180);
        } else { carte.style.transform = ''; scene.dataset.geste = ''; }
      };
      scene.addEventListener('pointerup', lacher);
      scene.addEventListener('pointercancel', lacher);
    }
    function fin() {
      const n = reste.length;
      zone.innerHTML = `<div class="fc-seance"><div class="er-card fc-fin">
        <span class="er-badge">${o.libre ? 'RÉVISION LIBRE TERMINÉE' : 'SÉANCE TERMINÉE'}</span>
        <div class="fc-fin-chiffres"><div><b>${total}</b><span>cartes révisées</span></div><div><b class="ok">${sues}</b><span>✓ je savais</span></div><div><b class="ko">${ratees}</b><span>✗ à revoir</span></div></div>
        ${o.libre ? '<p class="fc-note">Ta boîte n\'a pas changé : ces cartes restent à réviser à leur date.</p>'
          : n ? `<p class="fc-note"><b>Encore ${n} carte${n > 1 ? 's' : ''} à réviser aujourd'hui.</b> Continue maintenant ou plus tard dans la journée.</p>`
          : '<p class="fc-note">Les cartes sues avancent d\'une case, les autres reculent d\'une case.<br>Tu as fini pour aujourd\'hui ✓ Prochaine séance : <b>demain, 5 cartes</b>.</p>'}
        <div class="er-actions" style="justify-content:center">${n && !o.libre ? `<button type="button" class="btn-primary" id="fc-encore">Continuer (${Math.min(n, limite || n)} de plus) →</button><a class="btn-secondary" href="${o.retour || 'revisions.html'}">Plus tard</a>` : `<a class="btn-primary" href="${o.retour || 'revisions.html'}">Voir ma boîte →</a>`}</div></div></div>`;
      const b = zone.querySelector('#fc-encore');
      if (b) b.addEventListener('click', lot);
    }
    addEventListener('keydown', e => {
      if (!zone.querySelector('.fc-carte') || e.target.tagName === 'SELECT') return;
      if ((e.key === ' ' || e.key === 'Enter') && !retour) { e.preventDefault(); voir(); }
      else if (retour && e.key === 'ArrowRight') repondre(true);
      else if (retour && e.key === 'ArrowLeft') repondre(false);
    });
    lot();
  }

  /* ---------- Liste des cartes de l'application, par paquet ---------- */
  function paquets(zone) {
    zone.innerHTML = PAQUETS.map(p => {
      const n = p.cartes.length, actif = p.ajoute != null;
      let tete;
      if (actif) tete = `<span class="fc-etat ok">✓ Dans tes révisions depuis le ${date(p.ajoute).slice(5)}</span>`;
      if (p.vientDetre) tete += `<div class="fc-ajout" style="flex-basis:100%;margin:0"><p><b>✓ ${n} cartes ajoutées.</b> Première révision demain. Tu peux déjà les revoir maintenant : ta boîte ne changera pas.</p><a class="btn-primary" style="text-decoration:none" href="seance.html#libre-${p.id}">Les réviser maintenant</a></div>`;
      else if (p.coursFait) tete = '';
      else tete = '<span class="fc-etat">Pas encore dans tes révisions</span>';
      const ajout = actif ? '' : p.coursFait
        ? `<div class="fc-ajout"><p><b>Cours terminé ✓</b> Range ces ${n} cartes dans ta boîte : première révision demain.</p><button type="button" class="btn-primary" data-ajout="${p.id}">Ajouter les ${n} cartes à mes révisions</button></div>`
        : `<div class="fc-ajout attente"><p>Disponible après : <b>${p.apres}</b>.</p><a class="btn-small" href="#">Aller au cours</a><button type="button" class="fc-lien" data-ajout="${p.id}">Ajouter quand même</button></div>`;
      const lignes = p.cartes.map(c => {
        const txt = texteQ(c.faces[0].q);
        const qd = !actif ? '—' : c.e.c > MAX ? 'sue ✓' : c.e.d <= 0 ? 'aujourd\'hui' : `${dans(c.e.d)} · ${date(c.e.d).slice(0, 4)}`;
        return `<button type="button" class="fc-ligne${actif ? '' : ' inactive'}" data-id="${c.id}" aria-expanded="false"><span class="ty">${TYPES[c.type]}${c.faces.length > 1 ? ' ⇄' : ''}</span><span class="txt">${txt}</span><span class="cs">${actif ? 'Case ' + c.e.c : ''}</span><span class="qd${actif && c.e.d <= 0 ? ' du' : ''}">${qd}</span></button><div class="fc-apercu" id="ap-${c.id}" hidden></div>`;
      }).join('');
      // résumé du paquet : visible même replié
      const du = actif ? p.cartes.filter(c => c.e.d <= 0).length : 0;
      const resume = actif ? (du ? `<b class="fc-du">${du} à réviser aujourd'hui</b>` : `prochaine : ${dans(Math.min(...p.cartes.map(c => c.e.d)))}`) : p.coursFait ? '<b class="fc-du">prêt à ajouter</b>' : '';
      const ouvert = p.id === 'm1' || (!actif && p.coursFait);
      return `<details class="fc-paquet"${ouvert ? ' open' : ''}><summary class="fc-paquet-h"><h4>Module ${p.module} · ${p.titre}<small>${n} cartes${resume ? ' · ' + resume : ''}</small></h4>${tete}</summary>${ajout}<div class="fc-lignes">${lignes}</div></details>`;
    }).join('');
    // un clic sur une ligne montre la carte, recto et verso côte à côte
    zone.querySelectorAll('.fc-ligne').forEach(b => b.addEventListener('click', () => {
      const c = toutes().find(x => x.id === b.dataset.id), ap = document.getElementById('ap-' + c.id), ouvre = ap.hidden;
      if (ouvre && !ap.innerHTML) ap.innerHTML = c.faces.map((f, s) => face(c, s, 'recto', { pied: false }) + face(c, s, 'verso', { pied: false })).join('');
      ap.hidden = !ouvre; b.setAttribute('aria-expanded', ouvre);
    }));
    zone.querySelectorAll('[data-ajout]').forEach(b => b.addEventListener('click', () => {
      const p = PAQUETS.find(x => x.id === b.dataset.ajout);
      p.ajoute = 0; p.vientDetre = true; p.cartes.forEach(c => { c.e.c = 1; c.e.d = 1; });
      paquets(zone);
      if (window.FC.apresAjout) window.FC.apresAjout();
    }));
  }

  /* ---------- Mini-boîte (une barre par case, puis les sues) ---------- */
  function mini(cartes) {
    const n = [];
    for (let k = 1; k <= MAX + 1; k++) n.push(cartes.filter(c => (k > MAX ? c.e.c > MAX : c.e.c === k)));
    const m = Math.max(1, ...n.map(l => l.length));
    return '<span class="fc-mini" aria-hidden="true">' + n.map((l, k) => `<i class="${k === MAX ? 'ok' : l.some(c => c.e.d <= 0) ? 'du' : ''}" style="height:${l.length ? Math.max(3, Math.round(l.length / m * 28)) : 1}px"></i>`).join('') + '</span>';
  }

  /* ---------- Maquette : progression fictive, rien n'est écrit dans le navigateur ---------- */
  function demoStockage(cles) {
    const lire = Storage.prototype.getItem, ecrire = Storage.prototype.setItem, memoire = {};
    Object.keys(cles).forEach(k => { memoire[k] = JSON.stringify(cles[k]); });
    Storage.prototype.getItem = function (k) { return k in memoire ? memoire[k] : lire.call(this, k); };
    Storage.prototype.setItem = function (k, v) { if (k in memoire) memoire[k] = String(v); else ecrire.call(this, k, v); };
  }
  const PROG_DEMO = { derniere: 'module_4_cours', pages: { module_1_cours: { fait: true }, module_1_questions: { note: 16 }, module_2a_cours: { fait: true },
    module_2b_cours: { fait: true }, module_2_questions: { note: 13.5 }, module_3_cours: { fait: true }, module_3_questions: { note: 15 }, module_4_cours: { fait: true } } };

  /* ---------- Autres applications (comptes fictifs) ---------- */
  // cases : nombre de cartes de la case 1 à 7, puis sues ; prochaine : dans combien de jours
  const AUTRES = [
    { titre: 'Chapitre 5 : Flux et transferts thermiques', cases: [0, 4, 3, 2, 0, 0, 0, 0], prochaine: 1 },
    { titre: 'Chapitre 9 : Statique des fluides', cases: [0, 0, 1, 3, 5, 4, 1, 3], prochaine: 3 },
  ];
  AUTRES.forEach(a => { a.cartes = a.cases.reduce((l, n, k) => l.concat(Array.from({ length: n }, (_, j) => ({ e: { c: k + 1, d: a.prochaine + (j % 4) } }))), []); });
  const cartesAutres = () => AUTRES.reduce((l, a) => l.concat(a.cartes), []);

  window.FC = { INTERVALLES, COURT, LONG, MAX, TYPES, PAQUETS, AUTRES, PROG_DEMO, toutes, actives, dues, cartesAutres, face, boite, jours, mini, seance, paquets, demoStockage, date, dans };
})();
