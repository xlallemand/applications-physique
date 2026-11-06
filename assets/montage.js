/* ============================================================
   MONTAGE : réaliser un montage électrique à partir d'un schéma
   (application « Réaliser un montage électrique », réutilisé par
   « Lois de l'électricité »). Styles : assets/montage.css (mt-, ms-).

   Deux vues synchronisées :
   - le schéma normalisé (symboles, nœuds, intensités et tensions nommées,
     boucle principale surlignée, éléments branchés colorés) ;
   - la table de montage vue de dessus (générateur, multimètres, dipôles sur
     plaquette, fils souples tirés d'une borne à l'autre), matériel rangé
     en ligne comme sur la paillasse.
   Calcul des tensions et des intensités (générateur idéal réglable,
   résistances, lampes et moteur modélisés par des résistances, DEL à seuil
   de 2 V, interrupteur, ampèremètre de résistance nulle, voltmètre ouvert),
   affichage des multimètres selon la fonction, le calibre, l'entrée et le sens.

   ---------- Description d'un circuit (repère du schéma) ----------
   circuit = {
     vb: [largeur, hauteur],
     dipoles: [{ id, type, x, y, rot, valeur, nom, mesure, inverse, com }],
       type : generateur | resistance (valeur en Ω) | lampe | interrupteur | del | moteur | amperemetre | voltmetre
       bornes du symbole : 'a' (côté gauche avant rotation) et 'b' ;
       générateur : + en 'a' (inverse: true → + en 'b') ; DEL : anode (+) en 'a'
       nom : « la lampe L₁ » (sinon le nom du type) ; mesure : 'I_1', 'U_390' (appareils de mesure)
       com : ±1, côté de la borne COM (affiché avec l'option com)
     fils: [{ id, pts: [[x, y], …], a, b }],   a, b : 'R1.a', 'G.b' ou l'identifiant d'un nœud
     noeuds: [{ id, x, y }], croisements: [{ x, y }] (fils qui se croisent sans se toucher),
     intensites: [{ nom: 'I_1', x, y, dir: 'bas'|'haut'|'gauche'|'droite', cote }],
     tensions: [{ nom: 'U_G', x1, y1, x2, y2, cote }],
     tension: 8,                                tension à régler sur le générateur (V)
     table: ['L2', 'K', 'L1'],                  ordre des plaquettes sur la table (sinon au hasard)
   }

   ---------- API ----------
   MONTAGE.schema(zone, circuit, options) → { maj(options), svg }
     options : boucle, branches, choisis, derivs, allumes, touches (identifiants), cerne (nœud ou dipôle
               entouré), com (vrai ou liste d'identifiants), etats ({ K: { ouvert }, L1: { allumee } }),
               libre (éléments à toucher), onTouche({ type: 'fil'|'dipole'|'noeud'|'croisement', id })
   MONTAGE.graphe(circuit)                       sommets (points électriques), arêtes (dipôles), jonctions
   MONTAGE.verifierBoucle(circuit, choisis)      { ok, dips, sommets } ou { ok: false, diag, cerne }
   MONTAGE.calculer(scene)                       tensions des bornes, intensités, et état du matériel
   MONTAGE.monter(zone, circuit, options) → poste de montage complet (schéma, table, consigne, déroulé) :
     options = {
       boucle: true,              repérer d'abord la boucle principale sur le schéma
       com: false,                COM écrit sur le schéma
       mesures: 'lire' | 'dixA' | null,   lire tous les appareils (calibre adapté) ; ampèremètre en
                                  10 A puis en mA (première fois) ; ou rien (la page demande la mesure)
       tensionReglee: false,      vrai : le générateur est déjà réglé sur circuit.tension
       textes: { … },             remplace des textes de MONTAGE.TEXTES
       onFin(bilan),              { refus, montre, mesures: { I_1: { v, unite, texte } } }
       onChange(poste)
     }
     → { refus, montre, mesure(nom), montrer() (« Afficher le montage »), recommencer(), etapes }
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const fr = (v, d) => (d == null ? String(v) : Number(v).toFixed(d)).replace('.', ',').replace('-', '−');
  const indice = n => String(n || '').replace(/_(\w+)/, '<sub>$1</sub>');
  const R_LAMPE = 75, R_MOTEUR = 20, SEUIL_DEL = 2, P_LAMPE = .48;   // lampe 6 V – 80 mA

  /* ---------- Textes (remplaçables par l'option textes) ---------- */
  const TEXTES = {
    vide: 'Touche les fils et les dipôles de la boucle, puis « Vérifier ».',
    sansG: 'La boucle principale contient le générateur : c\'est lui qui fait circuler le courant.',
    voltBoucle: 'Le voltmètre n\'est pas dans la boucle principale : il se branche en dérivation, une fois la boucle faite.',
    ouverte: ou => `Ta boucle s'arrête ${ou} : suis les fils jusqu'à revenir au générateur.`,
    deuxFois: 'Ta boucle passe deux fois par le nœud cerclé sur le schéma : une boucle ne prend qu\'une des branches.',
    morceaux: 'Garde une seule boucle : celle qui part du générateur et y revient.',
    boucleOk: 'Juste ! C\'est la boucle principale : elle part du générateur et y revient. Elle reste surlignée pendant le montage.',
    boucleDabordSchema: 'Commence par la boucle principale, sur le schéma : touche ses fils et ses dipôles.',
    depart: 'On part toujours d\'une borne du générateur : la borne + ou la borne −.',
    suivant: (x, y) => `D'après le schéma, après ${x} vient ${y} : relie la borne libre ${de(x)} ${a(y)}.`,
    premier: (x, y) => `D'après le schéma, après ${x} vient ${y} : relie ${x} ${a(y)}.`,
    fermer: x => `D'après le schéma, après ${x} on revient au générateur : relie la borne libre ${de(x)} à l'autre borne du générateur.`,
    rejoindre: x => `D'après le schéma, après ${x} la dérivation rejoint le nœud cerclé sur le schéma : relie la borne libre ${de(x)} à une borne de ce nœud.`,
    dixA: 'On commence par l\'entrée 10A, le plus grand calibre ; on passe à mA ensuite si l\'intensité est petite.',
    voltBornes: 'Le voltmètre se branche sur ses bornes V et COM.',
    serieA: 'L\'ampèremètre se branche en série : le courant doit le traverser.',
    voltSerie: 'Le voltmètre se branche en dérivation, sur les bornes du dipôle, sans modifier le circuit.',
    boucleDabord: 'Ferme d\'abord la boucle principale ; on ajoute les dérivations ensuite.',
    ordreDeriv: (n, ou) => `D'après le schéma, la ${n} dérivation part du nœud cerclé sur le schéma${ou ? ` (${ou})` : ''}.`,
    noeud: 'Le schéma n\'a pas de nœud à cet endroit : on ne met deux fils sur une même borne que là où le schéma a un point noir.',
    court: 'Ce fil relierait directement les bornes du générateur.',
    fini: 'Le montage est terminé : il n\'y a plus de fil à poser.',
    retirerDernier: 'On retire les fils en commençant par le dernier posé.',
    finirDabord: 'Termine d\'abord le montage.',
    // consignes
    cBoucle: 'Surligne la <b>boucle principale</b> : touche ses fils et ses dipôles sur le schéma, puis « Vérifier ».',
    cDepart: 'Tire le premier fil depuis une <b>borne du générateur</b> (+ ou −), en suivant la boucle sur le schéma.',
    cSuite: x => `Continue la boucle : relie la borne libre ${de(x)} au dipôle suivant du schéma.`,
    cFermer: x => `Ferme la boucle : relie la borne libre ${de(x)} à l'autre borne du générateur.`,
    cDeriv: n => `Ajoute la ${n} dérivation : pars du nœud du schéma le plus proche du générateur.`,
    cDerivSuite: x => `Continue la dérivation : relie la borne libre ${de(x)} à la suite du schéma.`,
    cInterrupteur: 'Ferme l\'interrupteur : touche son levier.',
    cGenerateur: u => `Règle le générateur sur <b>${fr(u)} V</b> : touche son bouton.`,
    cDel: 'La DEL ne s\'éclaire pas.',
    cCal10: 'Règle l\'ampèremètre : touche son sélecteur, choisis la fonction <b>A ⎓</b> et le calibre <b>10 A</b>.',
    cVersmA: t => `L'écran affiche <b>${t}</b> : ${t.replace('.', ',')} A, lecture peu précise. Passe la fiche de l'entrée <b>10A</b> à l'entrée <b>mA</b> : fais-la glisser d'une borne à l'autre.`,
    cCalmA: 'Règle le calibre sur <b>200 mA</b> (zone A ⎓).',
    cMesures: noms => `Règle ${noms.length > 1 ? 'chaque appareil de mesure' : 'l\'appareil de mesure'} (fonction et calibre adapté) et lis ${noms.join(', ').replace(/, ([^,]*)$/, ' et $1')}.`,
    delQ: 'Pourquoi la DEL ne s\'éclaire-t-elle pas ?',
    delChoix: ['Elle ne laisse passer le courant que dans un sens.', 'La tension du générateur est trop faible.', 'La résistance empêche le courant de passer.', 'La DEL est grillée.'],
    delRep: 'Juste : la DEL ne laisse passer le courant que dans un sens. Retire les fils en partant du dernier posé jusqu\'à la DEL, puis rebranche-la dans l\'autre sens (borne + du côté de la borne + du générateur).',
    delFaux: 'Ce n\'est pas ça. Regarde le symbole de la DEL : le triangle montre le seul sens dans lequel elle laisse passer le courant.',
    fin: 'Le montage est terminé et il fonctionne.',
  };
  const de = n => n.replace(/^le /, 'du ').replace(/^la /, 'de la ').replace(/^l'/, 'de l\'');
  const a = n => n.replace(/^le /, 'au ').replace(/^la /, 'à la ').replace(/^l'/, 'à l\'');
  const NOMS = { generateur: 'le générateur', resistance: d => `la résistance de ${d.valeur} Ω`, lampe: 'la lampe', interrupteur: 'l\'interrupteur',
                 del: 'la DEL', moteur: 'le moteur', amperemetre: d => d.mesure ? `l'ampèremètre de ${indice(d.mesure)}` : 'l\'ampèremètre',
                 voltmetre: d => d.mesure ? `le voltmètre de ${indice(d.mesure)}` : 'le voltmètre' };
  const nomDe = d => d.nom || (typeof NOMS[d.type] === 'function' ? NOMS[d.type](d) : NOMS[d.type]);
  const genre = t => (t === 'amperemetre' || t === 'voltmetre') ? 'multimetre' : t;
  const sorte = d => genre(d.type) + (d.type === 'resistance' ? ':' + d.valeur : '');

  /* ---------- Dégradés partagés (une fois par page) ---------- */
  function defs() {
    if (document.getElementById('mt-defs')) return;
    const s = document.createElementNS(NS, 'svg');
    s.id = 'mt-defs'; s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    const lin = (id, st, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 || 0}" y2="${y2 == null ? 1 : y2}">${st}</linearGradient>`;
    const rad = (id, st, cx, cy, r) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${st}</radialGradient>`;
    const S = (o, c, op) => `<stop offset="${o}" class="mt-s-${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`;
    s.innerHTML = '<defs>'
      + lin('mt-g-boitier', S(0, 'sheet') + S(.6, 'paper2') + S(1, 'paper3'))
      + lin('mt-g-plaque', S(0, 'paper') + S(1, 'paper3'))
      + lin('mt-g-etui', S(0, 'ink3') + S(.5, 'ink2') + S(1, 'ink'), 1, 1)
      + lin('mt-g-ecran', S(0, 'paper') + S(1, 'paper3'))
      + lin('mt-g-corps', S(0, 'sheet') + S(.45, 'paper2') + S(1, 'ink3'))
      + lin('mt-g-levier', S(0, 'sheet') + S(1, 'ink3'))
      + rad('mt-g-metal', S(0, 'sheet') + S(.55, 'paper3') + S(1, 'ink3'), .35, .3, .75)
      + rad('mt-g-bouton', S(0, 'sheet') + S(.7, 'paper2') + S(1, 'paper3'), .38, .32, .8)
      + rad('mt-g-verre', S(0, 'sheet') + S(.6, 'sheet') + S(1, 'paper3'), .36, .32, .75)
      + rad('mt-g-moteur', S(0, 'paper') + S(.7, 'paper3') + S(1, 'ink3'), .4, .35, .75)
      + rad('mt-g-halo', S(0, 'cle', 1) + S(.55, 'cle', .9) + S(1, 'cle', 0), .5, .5, .5)
      + rad('mt-g-halo-del', S(0, 'dangerbg', 1) + S(.5, 'dangerbg', .9) + S(1, 'dangerbg', 0), .5, .5, .5)
      + rad('mt-g-del', S(0, 'sheet') + S(.4, 'danger') + S(1, 'dangertext'), .4, .35, .7)
      + rad('mt-g-deloff', S(0, 'sheet') + S(.6, 'dangerbg') + S(1, 'paper3'), .4, .35, .7)
      + '</defs>';
    document.body.prepend(s);
  }

  /* ---------- Afficheur à 7 segments ---------- */
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc',
                '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '' };
  function chiffre(x, y, h, on, point) {
    const w = h * .54, t = h * .13, m = t * .55, hh = h / 2;
    const r = (id, rx, ry, rw, rh) => `<rect class="${on.includes(id) ? 'mt-seg' : 'mt-seg-off'}" x="${(x + rx).toFixed(1)}" y="${(y + ry).toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" rx="${(t / 2).toFixed(1)}"/>`;
    let s = r('a', m, 0, w - 2 * m, t) + r('g', m, hh - t / 2, w - 2 * m, t) + r('d', m, h - t, w - 2 * m, t)
          + r('f', 0, m, t, hh - m - t * .2) + r('b', w - t, m, t, hh - m - t * .2)
          + r('e', 0, hh + t * .2, t, hh - m - t * .2) + r('c', w - t, hh + t * .2, t, hh - m - t * .2);
    if (point !== undefined) s += `<circle class="${point ? 'mt-seg' : 'mt-seg-off'}" cx="${(x + w + h * .1).toFixed(1)}" cy="${(y + h - t / 2).toFixed(1)}" r="${(t * .6).toFixed(1)}"/>`;
    return s;
  }
  // txt : « -16.3 », « 0.02 », « OL » (dépassement : « 1 » à gauche, comme les multimètres du lycée)
  function afficheur(x, y, h, txt, n, signe) {
    txt = String(txt == null ? '' : txt);
    let cases;
    const neg = txt.startsWith('-');
    if (neg) txt = txt.slice(1);
    if (txt === 'OL') cases = [{ c: '1', p: false }].concat(Array.from({ length: n - 1 }, () => ({ c: ' ', p: false })));
    else {
      cases = [];
      for (const c of txt) { if (c === '.' && cases.length) cases[cases.length - 1].p = true; else cases.push({ c, p: false }); }
      while (cases.length < n) cases.unshift({ c: ' ', p: false });
    }
    const pas = h * .8;
    let s = `<g transform="skewX(-7) translate(${(y * .12).toFixed(1)} 0)">`;
    if (signe) s += `<rect class="${neg ? 'mt-seg' : 'mt-seg-off'}" x="${x - h * .42}" y="${y + h / 2 - h * .065}" width="${h * .3}" height="${h * .13}" rx="${h * .06}"/>`;
    cases.slice(-n).forEach((k, i) => { s += chiffre(x + i * pas, y, h, SEG[k.c] || '', i < n - 1 ? k.p : undefined); });
    return s + '</g>';
  }

  /* ---------- Sélecteur du multimètre : 19 positions, crans de 18° ---------- */
  const POSITIONS = [
    { id: 'OFF', zone: 'OFF', lab: 'OFF' },
    { id: 'V600', zone: 'V⎓', lab: '600', cal: '600 V', max: 600, dec: 0 }, { id: 'V200', zone: 'V⎓', lab: '200', cal: '200 V', max: 200, dec: 1 },
    { id: 'V20', zone: 'V⎓', lab: '20', cal: '20 V', max: 20, dec: 2 }, { id: 'V2', zone: 'V⎓', lab: '2', cal: '2 V', max: 2, dec: 3 },
    { id: 'V200m', zone: 'V⎓', lab: '200m', cal: '200 mV', max: 200, dec: 1, k: 1000 },
    { id: 'VAC600', zone: 'V∼', lab: '600', cal: '600 V', max: 600, dec: 0 }, { id: 'VAC200', zone: 'V∼', lab: '200', cal: '200 V', max: 200, dec: 1 },
    { id: 'AAC10', zone: 'A∼', lab: '10A', cal: '10 A', max: 20, dec: 2 }, { id: 'AAC200m', zone: 'A∼', lab: '200m', cal: '200 mA', max: 200, dec: 1 },
    { id: 'A10', zone: 'A⎓', lab: '10A', cal: '10 A', max: 20, dec: 2, entree: '10A' },
    { id: 'A200m', zone: 'A⎓', lab: '200m', cal: '200 mA', max: 200, dec: 1, k: 1000, entree: 'mA' },
    { id: 'A20m', zone: 'A⎓', lab: '20m', cal: '20 mA', max: 20, dec: 2, k: 1000, entree: 'mA' },
    { id: 'A2m', zone: 'A⎓', lab: '2m', cal: '2 mA', max: 2, dec: 3, k: 1000, entree: 'mA' },
    { id: 'O200', zone: 'Ω', lab: '200', cal: '200 Ω' }, { id: 'O2k', zone: 'Ω', lab: '2k', cal: '2 kΩ' },
    { id: 'O20k', zone: 'Ω', lab: '20k', cal: '20 kΩ' }, { id: 'O200k', zone: 'Ω', lab: '200k', cal: '200 kΩ' }, { id: 'O2M', zone: 'Ω', lab: '2M', cal: '2 MΩ' },
  ];
  POSITIONS.forEach((p, i) => { p.ang = i * 18; });
  const ZONES = ['V⎓', 'V∼', 'A∼', 'A⎓', 'Ω'];
  const posDe = id => POSITIONS.find(p => p.id === id) || POSITIONS[0];
  const libellePosition = id => { const p = posDe(id); return p.id === 'OFF' ? 'Arrêt (OFF)' : `${p.zone} · ${p.cal}`; };
  const pol = (cx, cy, r, ang) => [cx + r * Math.sin(ang * Math.PI / 180), cy - r * Math.cos(ang * Math.PI / 180)];

  // cadran du multimètre : centre (cx, cy), bouton de rayon rb, étiquettes au rayon re, zones au rayon rz, police f ;
  // grand : rayon des zones à toucher (cadran agrandi)
  function cadran(cx, cy, rb, re, rz, f, pos, grand) {
    const p = posDe(pos);
    let s = `<circle class="mt-cadran" cx="${cx}" cy="${cy}" r="${re + f * 1.6}"/>`;
    ZONES.forEach(z => {
      const qs = POSITIONS.filter(q => q.zone === z), ang = qs.reduce((m, q) => m + q.ang, 0) / qs.length;
      const ra = re + f * 1.4, [x1, y1] = pol(cx, cy, ra, qs[0].ang - 6), [x2, y2] = pol(cx, cy, ra, qs[qs.length - 1].ang + 6);
      s += `<path class="mt-arc-zone${z === p.zone ? ' ici' : ''}" d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${ra} ${ra} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
      const [x, y] = pol(cx, cy, rz, ang);
      s += `<text class="mt-zone${z === p.zone ? ' ici' : ''}" x="${x.toFixed(1)}" y="${(y + f * .45).toFixed(1)}" font-size="${(f * 1.25).toFixed(1)}" text-anchor="middle">${z}</text>`;
    });
    POSITIONS.forEach(q => {
      const [x, y] = pol(cx, cy, re, q.ang), [tx, ty] = pol(cx, cy, rb + f * .55, q.ang);
      s += `<circle class="mt-cran" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(f * .17).toFixed(2)}"/>`;
      s += `<text class="mt-pos${q.id === p.id ? ' ici' : ''}" x="${x.toFixed(1)}" y="${(y + f * .35).toFixed(1)}" font-size="${f}" text-anchor="middle">${q.lab}</text>`;
      if (grand) s += `<circle class="mt-cible-pos" data-pos="${q.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${grand}"><title>${libellePosition(q.id)}</title></circle>`;
    });
    s += `<g transform="rotate(${p.ang} ${cx} ${cy})">
      <circle class="mt-bouton" cx="${cx}" cy="${cy}" r="${rb}"/>
      <rect class="mt-bouton-barre" x="${cx - rb * .3}" y="${cy - rb * .92}" width="${rb * .6}" height="${rb * 1.84}" rx="${rb * .3}"/>
      <path class="mt-bouton-index" d="M${cx} ${cy - rb * .98} l${-rb * .2} ${rb * .34} h${rb * .4} z"/></g>`;
    return s;
  }

  // cadran du générateur (agrandi) : 0 à 12 V sur 270°, graduations tous les 0,5 V, chiffres à toucher
  const angTension = u => -135 + 270 * Math.min(1, Math.max(0, u / 12));
  function cadranTension(u) {
    const cx = 150, cy = 150;
    let s = `<circle class="mt-cadran" cx="${cx}" cy="${cy}" r="132"/>`;
    for (let k = 0; k <= 24; k++) {
      const v = k / 2, [x1, y1] = pol(cx, cy, 70, angTension(v)), [x2, y2] = pol(cx, cy, k % 2 ? 78 : 84, angTension(v));
      s += `<line class="mt-grad" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      if (k % 2 === 0) {
        const [x, y] = pol(cx, cy, 106, angTension(v));
        s += `<text class="mt-pos${Math.abs(u - v) < .05 ? ' ici' : ''}" x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" font-size="15" text-anchor="middle">${v}</text>`;
        s += `<circle class="mt-cible-pos" data-tension="${v}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="21"><title>${v} V</title></circle>`;
      }
    }
    const [px, py] = pol(cx, cy, 46, angTension(u));
    s += `<g class="mt-bouton-tension"><circle class="mt-bouton-jupe" cx="${cx}" cy="${cy}" r="62"/><circle class="mt-bouton" cx="${cx}" cy="${cy}" r="54"/>
      <line class="mt-bouton-trait" x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" style="stroke-width:6"/></g>
      <circle class="mt-cible-rot" cx="${cx}" cy="${cy}" r="66"/>`;
    return s;
  }

  /* ---------- Matériel de la table (coordonnées locales) ---------- */
  // chaque fonction renvoie { w, h, svg, bornes: { nom: { x, y, genre } }, zones: { nom: { x, y, r } } }
  const MAT = {
    generateur(o) {
      const w = 180, h = 124, t = o.tension || 0, ang = angTension(t);
      const txt = Math.abs(t) >= 10 ? t.toFixed(1) : t.toFixed(2);
      return { w, h, svg: `
        <rect class="mt-boitier" x="0" y="0" width="${w}" height="${h}" rx="12"/>
        <rect class="mt-chant" x="2" y="${h - 7}" width="${w - 4}" height="5" rx="2.5"/>
        <text class="mt-marque" x="14" y="17">ALIMENTATION</text>
        <text class="mt-marque" x="${w - 14}" y="17" text-anchor="end">0 – 12 V ⎓</text>
        <rect class="mt-ecran-gen" x="14" y="25" width="90" height="40" rx="6"/>
        ${afficheur(24, 32, 25, txt, 3, true)}
        <text class="mt-ecran-unite" x="96" y="58" text-anchor="end">V</text>
        <circle class="mt-bouton-jupe" cx="143" cy="46" r="22"/><circle class="mt-bouton" cx="143" cy="46" r="17"/>
        <line class="mt-bouton-trait" x1="143" y1="46" x2="${pol(143, 46, 13, ang)[0].toFixed(1)}" y2="${pol(143, 46, 13, ang)[1].toFixed(1)}"/>
        <text class="mt-marque" x="143" y="80" text-anchor="middle">TENSION</text>
        <text class="mt-signe mt-signe-plus" x="40" y="105" text-anchor="middle">+</text>
        <text class="mt-signe" x="140" y="105" text-anchor="middle">−</text>`,
        bornes: { plus: { x: 62, y: 100, genre: 'plus' }, moins: { x: 118, y: 100, genre: 'moins' } },
        zones: { bouton: { x: 143, y: 46, r: 26 } } };
    },
    multimetre(o) {
      const w = 170, h = 262;
      return { w, h, svg: `
        <rect class="mt-etui" x="0" y="0" width="${w}" height="${h}" rx="20"/>
        <rect class="mt-face" x="8" y="8" width="${w - 16}" height="${h - 16}" rx="13"/>
        <rect class="mt-ecran" x="20" y="18" width="130" height="48" rx="6"/>
        ${afficheur(40, 27, 30, o.position === 'OFF' ? '' : (o.affiche == null ? '0.00' : o.affiche), 4, true)}
        ${cadran(85, 142, 24, 48, 65, 6.5, o.position || 'OFF')}
        <text class="mt-b-nom" x="19" y="216" text-anchor="middle">10A</text>
        <text class="mt-b-nom" x="63" y="216" text-anchor="middle">mA</text>
        <rect class="mt-com-cadre" x="91" y="206" width="32" height="13" rx="3"/>
        <text class="mt-b-nom" x="107" y="216" text-anchor="middle">COM</text>
        <text class="mt-b-nom" x="151" y="216" text-anchor="middle">VΩ</text>
        ${o.etiquette ? `<rect class="mt-etiquette" x="${w - 46}" y="-12" width="52" height="24" rx="12"/><text class="mt-etiquette-t" x="${w - 20}" y="5" text-anchor="middle">${o.etiquette}</text>` : ''}`,
        bornes: { '10A': { x: 19, y: 236, genre: 'entree' }, mA: { x: 63, y: 236, genre: 'entree' },
                  COM: { x: 107, y: 236, genre: 'com' }, V: { x: 151, y: 236, genre: 'entree' } },
        zones: { selecteur: { x: 85, y: 142, r: 42 } } };
    },
    _plaquette(h, yb, dedans, zones) {
      return { w: 112, h, svg: `<rect class="mt-plaque" x="0" y="0" width="112" height="${h}" rx="9"/>${dedans}`,
        bornes: { 1: { x: 24, y: yb, genre: 'neutre' }, 2: { x: 88, y: yb, genre: 'neutre' } }, zones: zones || {} };
    },
    resistance(o) {
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V26 H34 M88 54 V26 H78"/>
        <rect class="mt-corps" x="33" y="19" width="46" height="14" rx="6"/>
        <rect class="mt-anneau-r" x="41" y="19" width="3" height="14"/><rect class="mt-anneau-r" x="48" y="19" width="3" height="14"/>
        <rect class="mt-anneau-r" x="55" y="19" width="3" height="14"/><rect class="mt-anneau-r" x="68" y="19" width="3" height="14"/>
        <text class="mt-valeur" x="56" y="58" text-anchor="middle">${o.valeur} Ω</text>`);
    },
    lampe(o) {
      const e = o.eclat || 0;
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V26 H36 M88 54 V26 H76"/>
        ${e > 0 ? `<circle class="mt-halo" cx="56" cy="26" r="${(24 + 18 * e).toFixed(1)}" style="opacity:${(.45 + .55 * e).toFixed(2)}"/>` : ''}
        <circle class="mt-douille-lampe" cx="56" cy="26" r="19"/>
        <circle class="mt-verre${e > 0 ? ' allume' : ''}" cx="56" cy="26" r="14"/>
        <path class="mt-filament${e > 0 ? ' allume' : ''}" d="M49 29 l2.4 -6 l2.4 6 l2.4 -6 l2.4 6 l2.4 -6 l2.4 6"/>`);
    },
    interrupteur(o) {
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V28 H30 M88 54 V28 H82"/>
        <rect class="mt-contact" x="74" y="21" width="12" height="14" rx="3"/>
        <circle class="mt-pivot" cx="30" cy="28" r="6"/>
        <g transform="rotate(${o.ferme ? 0 : -22} 30 28)"><rect class="mt-lame" x="28" y="24.5" width="52" height="7" rx="3.5"/><circle class="mt-manette" cx="80" cy="28" r="7"/></g>
        <circle class="mt-rivet" cx="30" cy="28" r="2.4"/>`, { levier: { x: 60, y: 22, r: 26 } });
    },
    del(o) {
      return MAT._plaquette(76, 54, `
        <path class="mt-piste" d="M24 54 V28 H48 M88 54 V28 H64"/>
        ${o.allumee ? '<circle class="mt-halo-del" cx="56" cy="28" r="28"/>' : ''}
        <circle class="mt-del-collerette" cx="56" cy="28" r="10"/>
        <circle class="mt-del${o.allumee ? ' allume' : ''}" cx="56" cy="28" r="8"/>
        <text class="mt-signe-petit" x="8" y="42" text-anchor="middle">+</text>
        <text class="mt-marque" x="56" y="58" text-anchor="middle">DEL</text>`);
    },
    moteur(o) {
      const sens = o.tourne > 0 ? ' tourne' : o.tourne < 0 ? ' tourne inverse' : '';
      return MAT._plaquette(98, 76, `
        <path class="mt-piste" d="M24 76 V40 H34 M88 76 V40 H78"/>
        <circle class="mt-moteur" cx="56" cy="38" r="21"/>
        <g transform="translate(56 38)"><g class="mt-helice${sens}" style="animation-duration:${(o.duree || .5).toFixed(2)}s">
          <path class="mt-pale" d="M0 -3 C 6 -12, 5 -28, 0 -31 C -5 -28, -6 -12, 0 -3 Z"/>
          <path class="mt-pale" transform="rotate(120)" d="M0 -3 C 6 -12, 5 -28, 0 -31 C -5 -28, -6 -12, 0 -3 Z"/>
          <path class="mt-pale" transform="rotate(240)" d="M0 -3 C 6 -12, 5 -28, 0 -31 C -5 -28, -6 -12, 0 -3 Z"/>
          <circle class="mt-moyeu" r="5"/></g></g>
        ${o.tourne ? `<path class="mt-sens" d="${o.tourne > 0 ? 'M 86 18 A 34 34 0 0 1 92 40' : 'M 26 18 A 34 34 0 0 0 20 40'}" marker-end="url(#mt-fl-sens)"/>` : ''}`);
    },
  };
  const descMat = m => MAT[m.type](m);

  /* ---------- Fils souples ---------- */
  // Plusieurs formes de courbe sont essayées ; on garde celle qui passe le moins sur les appareils
  // (surtout les écrans et les cadrans) et près des autres bornes.
  const bez = (p, c, q, t) => {
    const u = 1 - t;
    return { x: u * u * u * p.x + 3 * u * u * t * c[0] + 3 * u * t * t * c[2] + t * t * t * q.x,
             y: u * u * u * p.y + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * q.y };
  };
  function candidats(p, q) {
    const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, l = [];
    [.1, .25, .45].forEach(k => [1, -1].forEach(sg => {
      const bo = sg * Math.min(90, 6 + d * k);
      l.push([p.x + dx * .2 + nx * bo, p.y + dy * .2 + ny * bo, p.x + dx * .8 + nx * bo, p.y + dy * .8 + ny * bo]);
    }));
    [30, 60, 100].forEach(h => { const Y = Math.max(p.y, q.y) + h; l.push([p.x + dx * .1, Y, q.x - dx * .1, Y]); });
    [30, 60].forEach(h => {
      const X1 = Math.min(p.x, q.x) - h, X2 = Math.max(p.x, q.x) + h;
      l.push([X1, p.y + dy * .1, X1, q.y - dy * .1], [X2, p.y + dy * .1, X2, q.y - dy * .1]);
    });
    return l;
  }
  function cout(p, q, c, ctx) {
    let p0 = p, len = 0, dedans = 0, hors = 0, pres = 0;
    for (let i = 1; i <= 32; i++) {
      const r = bez(p, c, q, i / 32), sl = Math.hypot(r.x - p0.x, r.y - p0.y);
      len += sl;
      if (Math.hypot(r.x - p.x, r.y - p.y) > 16 && Math.hypot(r.x - q.x, r.y - q.y) > 16) {
        const o = ctx.obst.find(b => r.x > b.x + 3 && r.x < b.x + b.w - 3 && r.y > b.y + 3 && r.y < b.y + b.h - 3);
        if (o) dedans += sl * o.poids;
        if (ctx.bornes.some(b => Math.hypot(b.x - r.x, b.y - r.y) < 13)) pres += sl;
      }
      if (r.x < 4 || r.x > ctx.W - 4 || r.y < 4 || r.y > ctx.H - 4) hors += sl;
      p0 = r;
    }
    return dedans + pres * 6 + hors * 8 + len * .3;
  }
  function tracerFil(p, q, ctx) {
    const l = candidats(p, q);
    let c = l[0];
    if (ctx) { let best = Infinity; l.forEach(k => { const v = cout(p, q, k, ctx); if (v < best) { best = v; c = k; } }); }
    const f = v => v.toFixed(1);
    return { d: `M${f(p.x)} ${f(p.y)} C${f(c[0])} ${f(c[1])} ${f(c[2])} ${f(c[3])} ${f(q.x)} ${f(q.y)}`, m: bez(p, c, q, .5) };
  }
  const fiche = (p, cls) => `<circle class="mt-fiche ${cls || ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7.5"/><circle class="mt-fiche-c" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6"/>`;

  /* ---------- Disposition « en rangée » : générateur et multimètres au fond, plaquettes devant ---------- */
  function disposer(materiel, W) {
    const gap = 10;
    let y = 8, rangee = [], larg = 0;
    const rangees = [];
    const fin = () => { if (rangee.length) rangees.push(rangee); rangee = []; larg = 0; };
    materiel.forEach((m, i) => {
      const d = descMat(m);
      const plaque = !['generateur', 'multimetre'].includes(m.type);
      if (plaque && i > 0 && !['interrupteur', 'resistance', 'lampe', 'del', 'moteur'].includes(materiel[i - 1].type)) fin();
      if (rangee.length && larg + gap + d.w > W) fin();
      larg += (rangee.length ? gap : 0) + d.w;
      rangee.push({ m, d });
    });
    fin();
    rangees.forEach(r => {
      const h = Math.max(...r.map(o => o.d.h)), somme = r.reduce((s, o) => s + o.d.w, 0);
      const plaques = r.every(o => !['generateur', 'multimetre'].includes(o.m.type));
      const g = plaques && r.length > 1 ? (W - somme) / (r.length - 1) : gap;
      let x = plaques && r.length === 1 ? (W - somme) / 2 : 0;
      r.forEach(o => { o.m.x = Math.round(x); o.m.y = Math.round(y + (plaques ? (h - o.d.h) / 2 : 0)); x += o.d.w + Math.min(g, 60); });
      y += h + 16;
    });
    return y + 40;
  }

  /* ============================================================
     TABLE DE MONTAGE (vue) : dessin et gestes ; l'état appartient à l'appelant
     scene = { W, H, materiel: [{ id, type, x, y, … }], fils: [[a, b]] }
     opt = { rendu, actif, onFil(a, b), onFilTouche(i), onRetirer(i), onCommande(id, nom, valeur), retirable(i) }
     ============================================================ */
  function table(zone, scene, opt) {
    defs();
    opt = Object.assign({ rendu: 'relief', actif: true }, opt || {});
    const st = { choisiFil: -1, depart: null, drag: null, survol: null, message: null, reglage: null, fin: false };
    zone.classList.add('mt-table');
    zone.innerHTML = '<svg class="mt-svg" role="img" aria-label="Table de montage vue de dessus"></svg><div class="mt-calque"></div>';
    const svg = zone.querySelector('svg'), calque = zone.querySelector('.mt-calque');
    const mat = id => scene.materiel.find(m => m.id === id);
    function borneAbs(ref) {
      const [id, b] = ref.split('.'), m = mat(id), p = descMat(m).bornes[b];
      return { x: m.x + p.x, y: m.y + p.y, genre: p.genre, ref };
    }
    const toutesBornes = () => {
      const l = [];
      scene.materiel.forEach(m => Object.keys(descMat(m).bornes).forEach(b => l.push(borneAbs(m.id + '.' + b))));
      return l;
    };
    const bout = (ref, k) => { const p = borneAbs(ref); return { x: p.x + k * 5, y: p.y - k * 6 }; };
    const pc = (v, t) => (100 * v / t).toFixed(3) + '%';
    let traces = [];

    function dessiner() {
      const W = scene.W, H = scene.H;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('class', 'mt-svg mt-rendu-' + opt.rendu);
      let s = '<defs><marker id="mt-fl-sens" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="mt-sens-pointe"/></marker></defs>';
      s += `<rect class="mt-plateau" x="0" y="0" width="${W}" height="${H}" rx="14"/>`;
      scene.materiel.forEach(m => {
        const d = descMat(m);
        s += `<g class="mt-mat mt-${m.type}" transform="translate(${m.x} ${m.y})">${d.svg}`;
        Object.values(d.bornes).forEach(b => {
          s += `<g class="mt-borne mt-b-${b.genre}"><circle class="mt-b-anneau" cx="${b.x}" cy="${b.y}" r="11"/><circle class="mt-b-douille" cx="${b.x}" cy="${b.y}" r="8"/><circle class="mt-b-trou" cx="${b.x}" cy="${b.y}" r="3.3"/></g>`;
        });
        s += '</g>';
      });
      // fils posés (fiches empilées sur une même borne)
      const compte = {};
      const bouts = scene.fils.map(([p, q]) => {
        const kp = compte[p] = (compte[p] || 0) + 1, kq = compte[q] = (compte[q] || 0) + 1;
        return [bout(p, kp - 1), bout(q, kq - 1)];
      });
      const ctx = { W, H, bornes: toutesBornes(),
        obst: scene.materiel.map(m => { const d = descMat(m); return { x: m.x, y: m.y, w: d.w, h: d.h, poids: { multimetre: 6, generateur: 5 }[m.type] || 1.5 }; }) };
      traces = bouts.map(([p, q]) => tracerFil(p, q, ctx));
      traces.forEach((t, i) => {
        s += `<g class="mt-fil${i === st.choisiFil ? ' choisi' : ''}"><path class="mt-cable-halo" d="${t.d}"/><path class="mt-cable" d="${t.d}"/><path class="mt-cable-reflet" d="${t.d}"/>${fiche(bouts[i][0])}${fiche(bouts[i][1])}</g>`;
      });
      if (st.drag && st.drag.bouge) s += `<g class="mt-fil mt-fil-encours"><path class="mt-cable" d="${tracerFil(st.drag.de, st.drag.vers).d}"/>${fiche(st.drag.vers, 'mt-fiche-encours')}</g>`;
      if (opt.actif) {
        traces.forEach((t, i) => { s += `<path class="mt-cible-fil" data-fil="${i}" d="${t.d}"/>`; });
        scene.materiel.forEach(m => Object.entries(descMat(m).zones).forEach(([nom, z]) => {
          s += `<circle class="mt-cible-cmd" data-cmd="${m.id}.${nom}" cx="${m.x + z.x}" cy="${m.y + z.y}" r="${z.r}"/>`;
        }));
      }
      toutesBornes().forEach(b => {
        const cls = (st.depart === b.ref ? ' depart' : '') + (st.survol === b.ref ? ' survol' : '') + (st.message && st.message.borne === b.ref ? ' refusee' : '');
        s += `<circle class="mt-cible${cls}" data-borne="${b.ref}" cx="${b.x}" cy="${b.y}" r="22"/>`;
      });
      svg.innerHTML = s;
      dessinerCalque();
    }

    function dessinerCalque() {
      let h = '';
      if (st.choisiFil >= 0 && traces[st.choisiFil]) {
        const m = traces[st.choisiFil].m;
        h += `<button type="button" class="mt-retirer" style="left:${pc(m.x, scene.W)};top:${pc(m.y, scene.H)}">Retirer ce fil</button>`;
      }
      if (st.message) {
        const b = borneAbs(st.message.borne), bas = b.y < scene.H * .55;
        h += `<div class="mt-bulle callout-danger ${bas ? 'mt-bulle-bas' : 'mt-bulle-haut'}" role="alert" data-x="${b.x / scene.W}"
                style="top:${pc(bas ? b.y + 26 : b.y - 26, scene.H)}">${st.message.html}</div>`;
      }
      if (st.reglage) h += reglageHTML();
      calque.innerHTML = h;
      const bu = calque.querySelector('.mt-bulle');
      if (bu) {
        const L = zone.clientWidth, x = +bu.dataset.x * L, lb = bu.offsetWidth;
        const g = Math.max(4, Math.min(L - lb - 4, x - lb / 2));
        bu.style.left = g + 'px';
        bu.style.setProperty('--fx', (x - g) + 'px');
      }
    }

    // réglage agrandi : sélecteur du multimètre ou bouton du générateur
    function reglageHTML() {
      const m = mat(st.reglage);
      if (m.type === 'generateur') {
        const t = m.tension || 0, txt = Math.abs(t) >= 10 ? t.toFixed(1) : t.toFixed(2);
        return `<div class="mt-reglage" role="dialog" aria-label="Réglage de la tension du générateur">
          <div class="mt-rg-tete"><svg class="mt-rg-ecran" viewBox="0 0 90 40" aria-hidden="true"><rect class="mt-ecran-gen" x="0" y="0" width="90" height="40" rx="6"/>${afficheur(10, 7, 25, txt, 3, true)}<text class="mt-ecran-unite" x="83" y="33" text-anchor="end">V</text></svg>
            <b>Tension du générateur</b><span>Touche une graduation ou fais tourner le bouton</span></div>
          <svg viewBox="0 0 300 300" class="mt-rg-svg mt-rg-tension">${cadranTension(t)}</svg>
          <div class="mt-rg-fins"><button type="button" class="mt-rg-bt" data-pas="-0.1" aria-label="Baisser de 0,1 V">−0,1</button>
            <span class="mt-rg-val">${fr(t, 2)} V</span><button type="button" class="mt-rg-bt" data-pas="0.1" aria-label="Monter de 0,1 V">+0,1</button></div>
          <button type="button" class="btn-primary mt-rg-ok">OK</button></div>`;
      }
      return `<div class="mt-reglage" role="dialog" aria-label="Sélecteur du multimètre">
        <div class="mt-rg-tete"><svg class="mt-rg-ecran" viewBox="0 0 130 48" aria-hidden="true"><rect class="mt-ecran" x="0" y="0" width="130" height="48" rx="6"/>${afficheur(20, 9, 30, m.position === 'OFF' ? '' : (m.affiche == null ? '0.00' : m.affiche), 4, true)}</svg>
          <b>Sélecteur du multimètre</b><span>${libellePosition(m.position)}</span></div>
        <svg viewBox="0 0 300 300" class="mt-rg-svg">${cadran(150, 150, 46, 104, 136, 13, m.position, 21)}</svg>
        <button type="button" class="btn-primary mt-rg-ok">OK</button></div>`;
    }

    /* --- gestes --- */
    function point(ev, el) {
      const p = (el || svg).createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
      return p.matrixTransform((el || svg).getScreenCTM().inverse());
    }
    function bornePres(p, rmax) {
      let best = null, dmin = rmax;
      toutesBornes().forEach(b => { const d = Math.hypot(b.x - p.x, b.y - p.y); if (d < dmin) { dmin = d; best = b; } });
      return best;
    }
    const fermerTout = () => { st.choisiFil = -1; st.depart = null; st.reglage = null; st.message = null; };

    svg.addEventListener('pointerdown', ev => {
      st.finBorne = false;
      if (!opt.actif || !ev.target.dataset.borne) return;
      ev.preventDefault();
      st.choisiFil = -1; st.reglage = null; st.message = null;   // la borne de départ (deux appuis) est gardée
      const b = borneAbs(ev.target.dataset.borne);
      st.drag = { id: ev.pointerId, ref: b.ref, de: b, vers: { x: b.x, y: b.y }, x0: ev.clientX, y0: ev.clientY, bouge: false };
      try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
      dessiner();
    });
    svg.addEventListener('pointermove', ev => {
      if (!st.drag || ev.pointerId !== st.drag.id) return;
      if (Math.hypot(ev.clientX - st.drag.x0, ev.clientY - st.drag.y0) > 8) st.drag.bouge = true;
      if (!st.drag.bouge) return;
      const p = point(ev), b = bornePres(p, 24);
      st.survol = b && b.ref !== st.drag.ref ? b.ref : null;
      st.drag.vers = st.survol ? { x: b.x, y: b.y } : { x: p.x, y: p.y };
      dessiner();
    });
    svg.addEventListener('pointerup', ev => {
      if (!st.drag || ev.pointerId !== st.drag.id) return;
      const d = st.drag; st.drag = null; st.survol = null; st.finBorne = true;
      setTimeout(() => { st.finBorne = false; }, 400);
      let a = null, b = null;
      if (d.bouge) { const r = bornePres(point(ev), 26); if (r && r.ref !== d.ref) { a = d.ref; b = r.ref; } st.depart = null; }
      else if (st.depart && st.depart !== d.ref) { a = st.depart; b = d.ref; st.depart = null; }   // deuxième appui
      else st.depart = st.depart === d.ref ? null : d.ref;                                       // premier appui
      dessiner();
      if (a && opt.onFil) opt.onFil(a, b);
    });
    svg.addEventListener('pointercancel', ev => { if (st.drag && ev.pointerId === st.drag.id) { st.drag = null; st.survol = null; dessiner(); } });
    svg.addEventListener('click', ev => {
      if (st.finBorne) { st.finBorne = false; return; }
      if (!opt.actif) return;
      const t = ev.target;
      if (t.dataset.fil != null) {
        const i = +t.dataset.fil;
        fermerTout();
        if (opt.retirable && !opt.retirable(i)) { if (opt.onFilTouche) opt.onFilTouche(i); }
        else st.choisiFil = i;
        dessiner(); return;
      }
      if (t.dataset.cmd) {
        const [id, nom] = t.dataset.cmd.split('.');
        fermerTout();
        if (nom === 'levier') { if (opt.onCommande) opt.onCommande(id, 'levier'); }
        else st.reglage = id;
        dessiner(); return;
      }
      if (st.choisiFil >= 0 || st.depart || st.reglage || st.message) { fermerTout(); dessiner(); }
    });
    // réglages agrandis : graduations, positions, bouton à faire tourner, pas fins
    let rot = null;
    calque.addEventListener('click', ev => {
      const t = ev.target.closest('button, [data-pos], [data-tension]');
      if (!t || !st.reglage) return;
      const m = mat(st.reglage);
      if (t.classList.contains('mt-rg-ok')) { st.reglage = null; dessiner(); return; }
      if (t.dataset.pos && opt.onCommande) opt.onCommande(m.id, 'position', t.dataset.pos);
      else if (t.dataset.tension != null && opt.onCommande) opt.onCommande(m.id, 'tension', +t.dataset.tension);
      else if (t.dataset.pas && opt.onCommande) opt.onCommande(m.id, 'tension', Math.round(Math.min(12, Math.max(0, (m.tension || 0) + +t.dataset.pas)) * 10) / 10);
    });
    calque.addEventListener('click', ev => {
      const t = ev.target.closest('.mt-retirer');
      if (!t) return;
      const i = st.choisiFil; fermerTout(); dessiner();
      if (opt.onRetirer) opt.onRetirer(i);
    });
    calque.addEventListener('pointerdown', ev => {
      if (!ev.target.classList.contains('mt-cible-rot')) return;
      ev.preventDefault();
      rot = ev.pointerId;
      // capture sur le calque, qui n'est jamais redessiné (le cadran l'est à chaque cran)
      try { calque.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
    });
    calque.addEventListener('pointermove', ev => {
      if (rot !== ev.pointerId || !st.reglage) return;
      const s2 = calque.querySelector('.mt-rg-tension');
      const p = point(ev, s2);
      let ang = Math.atan2(p.x - 150, -(p.y - 150)) * 180 / Math.PI;
      ang = Math.max(-135, Math.min(135, ang));
      const u = Math.round((ang + 135) / 270 * 120) / 10;
      if (opt.onCommande) opt.onCommande(st.reglage, 'tension', u);
    });
    const finRot = ev => { if (rot === ev.pointerId) rot = null; };
    calque.addEventListener('pointerup', finRot);
    calque.addEventListener('pointercancel', finRot);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && (st.reglage || st.depart || st.choisiFil >= 0 || st.message)) { fermerTout(); dessiner(); } });

    let largeur = zone.clientWidth;
    if (opt.onLargeur) opt.onLargeur(largeur);
    const ro = new ResizeObserver(() => { if (zone.clientWidth !== largeur) { largeur = zone.clientWidth; if (opt.onLargeur) opt.onLargeur(largeur); dessiner(); } });
    ro.observe(zone);
    dessiner();

    return {
      dessiner,
      get scene() { return scene; },
      set scene(s) { scene = s; },
      refus(borne, html) { st.message = borne ? { borne, html } : null; dessiner(); },
      effacerMessage() { if (st.message) { st.message = null; dessiner(); } },
      reglage(id) { st.reglage = id || null; dessiner(); },
      choisirFil(i) { st.choisiFil = i; dessiner(); },
      actif(v) { opt.actif = v; fermerTout(); dessiner(); },
      options(o) { Object.assign(opt, o); dessiner(); },
      detruire() { ro.disconnect(); zone.innerHTML = ''; },
    };
  }

  /* ============================================================
     SCHÉMA NORMALISÉ
     ============================================================ */
  function symbole(d, et) {
    const up = t => `<text class="ms-lettre" transform="rotate(${-(d.rot || 0)})" x="0" y="0.5" dy=".35em" text-anchor="middle">${t}</text>`;
    switch (d.type) {
      case 'generateur': return [`<circle class="ms-trait ms-fond" r="12"/>${up('G')}`, 12];
      case 'amperemetre': return [`<circle class="ms-trait ms-fond" r="11"/>${up('A')}`, 11];
      case 'voltmetre': return [`<circle class="ms-trait ms-fond" r="11"/>${up('V')}`, 11];
      case 'moteur': return [`<circle class="ms-trait ms-fond" r="11"/>${up('M')}`, 11];
      case 'lampe': return [`${et && et.allumee ? '<circle class="ms-halo" r="17"/>' : ''}<circle class="ms-trait ms-fond" r="10"/><path class="ms-trait" d="M-7.1 -7.1 L7.1 7.1 M-7.1 7.1 L7.1 -7.1"/>`, 10];
      case 'resistance': return [`<rect class="ms-trait ms-fond" x="-21" y="-8" width="42" height="16"/><text class="ms-valeur" transform="rotate(${-(d.rot || 0)})" x="0" y="0" dy=".35em" text-anchor="middle">${d.valeur} Ω</text>`, 21];
      case 'interrupteur': {
        const ouvert = et && et.ouvert != null ? et.ouvert : true;
        return [(ouvert ? '<path class="ms-trait" d="M-14 0 L-10 0 L9 -11"/>' : '<path class="ms-trait" d="M-14 0 L-10 0 L11 -3.2"/>')
          + '<path class="ms-trait" d="M10 0 H14 M10 0 V-4"/><circle class="ms-pt" cx="-10" r="1.8"/>', 14];
      }
      case 'del': return [`<path class="ms-trait ms-fond" d="M-7 -8 L-7 8 L7 0 Z"/><path class="ms-trait" d="M-12 0 H-7 M7 -8 V8 M7 0 H12"/>
        <path class="ms-trait ms-fin" d="M1 -10 L7 -16 M5 -7 L11 -13"/><path class="ms-pointe" d="M7 -16 l-4 1 l3 3 z M11 -13 l-4 1 l3 3 z"/>`, 12];
      default: return ['', 10];
    }
  }
  // position d'une borne de symbole ('a' à gauche, 'b' à droite avant rotation)
  function borneSchema(d, t) {
    const [, L] = symbole(d), r = (d.rot || 0) * Math.PI / 180, lx = t === 'a' ? -L : L;
    return [d.x + lx * Math.cos(r), d.y + lx * Math.sin(r)];
  }
  const nomHTML = n => String(n).replace(/_(\w+)/, '<tspan class="ms-ind" dy="3">$1</tspan>');

  function schema(zone, c, opt) {
    opt = Object.assign({ boucle: [], branches: [], choisis: [], derivs: [], allumes: [], touches: [], cerne: null, com: false, etats: {}, libre: false }, opt || {});
    zone.classList.add('ms-schema');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ms-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Schéma normalisé du circuit');
    zone.innerHTML = ''; zone.appendChild(svg);
    const dans = (l, id) => (l || []).includes(id);
    const pts = p => p.map(q => q.join(',')).join(' ');

    function dessiner() {
      svg.setAttribute('viewBox', c.vb.length === 4 ? c.vb.join(' ') : `0 0 ${c.vb[0]} ${c.vb[1]}`);
      let fond = '', haut = '', cibles = '';
      c.fils.forEach(f => { if (dans(opt.boucle, f.id)) fond += `<polyline class="ms-boucle" points="${pts(f.pts)}"/>`; });
      c.dipoles.forEach(d => {
        if (!dans(opt.boucle, d.id)) return;
        const [, L] = symbole(d);
        fond += `<g transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})"><path class="ms-boucle" d="M${-L - 2} 0 H${L + 2}"/></g>`;
      });
      const etat = id => dans(opt.choisis, id) ? ' choisi' : dans(opt.derivs, id) ? ' deriv' : dans(opt.branches, id) ? ' branche' : '';
      c.fils.forEach(f => {
        haut += `<polyline class="ms-fil${etat(f.id)}" points="${pts(f.pts)}"/>`;
        if (opt.libre) cibles += `<polyline class="ms-cible" data-type="fil" data-id="${f.id}" points="${pts(f.pts)}"/>`;
      });
      c.dipoles.forEach(d => {
        const [s, L] = symbole(d, opt.etats[d.id]);
        haut += `<g class="ms-dipole${etat(d.id)}" transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})">${s}</g>`;
        const r = (d.rot || 0) * Math.PI / 180, rp = (lx, ly) => [d.x + lx * Math.cos(r) - ly * Math.sin(r), d.y + lx * Math.sin(r) + ly * Math.cos(r)];
        if (d.type === 'generateur') {
          const s1 = d.inverse ? -1 : 1, [px, py] = rp(-15 * s1, -15), [mx, my] = rp(15 * s1, -15);
          haut += `<text class="ms-signe" x="${px.toFixed(1)}" y="${py.toFixed(1)}" dy=".35em" text-anchor="middle">+</text><text class="ms-signe" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" dy=".35em" text-anchor="middle">−</text>`;
        }
        if (d.com && (opt.com === true || dans(opt.com, d.id))) {
          const [cx, cy] = rp(d.com * 15, 13);
          haut += `<text class="ms-com" x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" dy=".35em" text-anchor="middle">COM</text>`;
        }
        if (d.lab) haut += `<text class="ms-lab" x="${d.x + ((d.rot || 0) % 180 ? 16 : 0)}" y="${d.y + ((d.rot || 0) % 180 ? 0 : -17)}" dy=".35em" text-anchor="${(d.rot || 0) % 180 ? 'start' : 'middle'}">${d.lab}</text>`;
        if (opt.cerne === d.id) haut += `<circle class="ms-cerne" cx="${d.x}" cy="${d.y}" r="${L + 9}"/>`;
        if (opt.libre) cibles += `<g transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})"><rect class="ms-cible-d" data-type="dipole" data-id="${d.id}" x="${-L - 4}" y="-15" width="${2 * L + 8}" height="30"/></g>`;
      });
      (c.noeuds || []).forEach(n => {
        if (dans(opt.allumes, n.id)) haut += `<circle class="ms-noeud-halo" cx="${n.x}" cy="${n.y}" r="8"/><circle class="ms-noeud allume" cx="${n.x}" cy="${n.y}" r="3.8"/>`;
        else if (dans(opt.touches, n.id)) haut += `<circle class="ms-noeud-touche" cx="${n.x}" cy="${n.y}" r="8"/><circle class="ms-noeud" cx="${n.x}" cy="${n.y}" r="3.8"/>`;
        else haut += `<circle class="ms-noeud" cx="${n.x}" cy="${n.y}" r="3.4"/>`;
        if (opt.cerne === n.id) haut += `<circle class="ms-cerne" cx="${n.x}" cy="${n.y}" r="11"/>`;
        if (opt.libre) cibles += `<circle class="ms-cible-n" data-type="noeud" data-id="${n.id}" cx="${n.x}" cy="${n.y}" r="13"/>`;
      });
      (c.croisements || []).forEach((k, i) => { if (opt.libre) cibles += `<circle class="ms-cible-n" data-type="croisement" data-id="${i}" cx="${k.x}" cy="${k.y}" r="13"/>`; });
      (c.intensites || []).forEach(i => {
        const R = { bas: 90, haut: -90, droite: 0, gauche: 180 }[i.dir] || 0, vert = i.dir === 'bas' || i.dir === 'haut';
        haut += `<g transform="translate(${i.x} ${i.y}) rotate(${R})"><path class="ms-pointe" d="M4 0 L-4 -4 L-4 4 Z"/></g>`;
        const [lx, ly] = vert ? [i.x + (i.cote === 'droite' ? 9 : -9), i.y] : [i.x, i.y + (i.cote === 'bas' ? 11 : -10)];
        haut += `<text class="ms-nom" x="${lx}" y="${ly}" dy=".35em" text-anchor="${vert ? (i.cote === 'droite' ? 'start' : 'end') : 'middle'}">${nomHTML(i.nom)}</text>`;
      });
      (c.tensions || []).forEach(u => {
        const dx = u.x2 - u.x1, dy = u.y2 - u.y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
        haut += `<path class="ms-tension" d="M${u.x1} ${u.y1} L${(u.x2 - ux * 5).toFixed(1)} ${(u.y2 - uy * 5).toFixed(1)}"/>`
              + `<path class="ms-pointe" d="M${u.x2} ${u.y2} l${(-ux * 7 - uy * 3.5).toFixed(1)} ${(-uy * 7 + ux * 3.5).toFixed(1)} l${(uy * 7).toFixed(1)} ${(-ux * 7).toFixed(1)} z"/>`;
        const mx = (u.x1 + u.x2) / 2, my = (u.y1 + u.y2) / 2;
        const [lx, ly, an] = Math.abs(dx) > Math.abs(dy) ? [mx, my + (u.cote === 'bas' ? 11 : -9), 'middle'] : [mx + (u.cote === 'droite' ? 7 : -7), my, u.cote === 'droite' ? 'start' : 'end'];
        haut += `<text class="ms-nom" x="${lx}" y="${ly}" dy=".35em" text-anchor="${an}">${nomHTML(u.nom)}</text>`;
      });
      svg.innerHTML = fond + haut + cibles;
    }
    svg.addEventListener('click', ev => {
      const t = ev.target;
      if (!opt.libre || !t.dataset || !t.dataset.type) return;
      if (opt.onTouche) opt.onTouche({ type: t.dataset.type, id: t.dataset.type === 'croisement' ? +t.dataset.id : t.dataset.id });
    });
    dessiner();
    return { maj(o) { Object.assign(opt, o || {}); dessiner(); }, svg, get options() { return opt; } };
  }

  /* ============================================================
     TOPOLOGIE DU SCHÉMA
     Sommets = points électriques (extrémités reliées par des fils du schéma) ;
     arêtes = dipôles. Une jonction est un sommet où arrivent au moins 3 bornes.
     ============================================================ */
  const plusDe = d => (d.inverse ? 'b' : 'a');   // borne + du générateur, anode de la DEL
  function graphe(c) {
    const par = {};
    const f = x => { if (par[x] == null) par[x] = x; while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    c.dipoles.forEach(d => { f(d.id + '.a'); f(d.id + '.b'); });
    (c.noeuds || []).forEach(n => f(n.id));
    c.fils.forEach(w => { par[f(w.a)] = f(w.b); });
    const sommet = e => f(e);
    const deg = {};
    c.dipoles.forEach(d => ['a', 'b'].forEach(t => { const s = sommet(d.id + '.' + t); deg[s] = (deg[s] || 0) + 1; }));
    const G = c.dipoles.find(d => d.type === 'generateur');
    return {
      sommet, deg, G,
      jonction: s => (deg[s] || 0) >= 3,
      dip: id => c.dipoles.find(d => d.id === id),
      aretes: c.dipoles.map(d => ({ id: d.id, u: sommet(d.id + '.a'), v: sommet(d.id + '.b') })),
      plus: sommet(G.id + '.' + plusDe(G)), moins: sommet(G.id + '.' + (plusDe(G) === 'a' ? 'b' : 'a')),
      // fils du schéma entre deux extrémités d'un même sommet (chemin dans l'arbre des fils)
      chemin(e1, e2) {
        if (e1 === e2) return [];
        const adj = {};
        c.fils.forEach(w => { (adj[w.a] = adj[w.a] || []).push([w.b, w.id]); (adj[w.b] = adj[w.b] || []).push([w.a, w.id]); });
        const prec = { [e1]: null }, file = [e1];
        while (file.length) {
          const x = file.shift();
          if (x === e2) break;
          (adj[x] || []).forEach(([y, id]) => { if (!(y in prec)) { prec[y] = [x, id]; file.push(y); } });
        }
        if (!(e2 in prec)) return [];
        const l = [];
        for (let x = e2; prec[x]; x = prec[x][0]) l.push(prec[x][1]);
        return l;
      },
    };
  }

  // boucle choisie sur le schéma (fils et dipôles) : diagnostic, ou dipôles dans l'ordre depuis la borne +
  function verifierBoucle(c, choisis, textes) {
    const T = Object.assign({}, TEXTES, textes || {});
    const S = new Set(choisis);
    const gr = graphe(c), G = gr.G;
    if (!S.size) return { ok: false, diag: T.vide };
    if (!S.has(G.id)) return { ok: false, diag: T.sansG, cerne: G.id };
    const v = c.dipoles.find(d => S.has(d.id) && d.type === 'voltmetre');
    if (v) return { ok: false, diag: T.voltBoucle, cerne: v.id };
    const deg = {}, ajout = e => { deg[e] = (deg[e] || 0) + 1; };
    const fils = c.fils.filter(w => S.has(w.id)), dips = c.dipoles.filter(d => S.has(d.id));
    fils.forEach(w => { ajout(w.a); ajout(w.b); });
    dips.forEach(d => { ajout(d.id + '.a'); ajout(d.id + '.b'); });
    const estNoeud = e => (c.noeuds || []).some(n => n.id === e);
    const n3 = Object.keys(deg).find(e => estNoeud(e) && deg[e] >= 3);
    if (n3) return { ok: false, diag: T.deuxFois, cerne: n3 };
    const bout = Object.keys(deg).find(e => deg[e] === 1);
    if (bout) {
      if (estNoeud(bout)) return { ok: false, diag: T.ouverte('au nœud cerclé sur le schéma'), cerne: bout };
      const d = gr.dip(bout.split('.')[0]);
      return { ok: false, diag: T.ouverte(a(nomDe(d))), cerne: d.id };
    }
    // parcours depuis la borne + du générateur, en s'éloignant du générateur
    const aretes = fils.map(w => ({ x: w.a, y: w.b, fil: w.id })).concat(dips.map(d => ({ x: d.id + '.a', y: d.id + '.b', dip: d.id })));
    const debut = G.id + '.' + plusDe(G);
    let e = debut, venue = aretes.find(r => r.dip === G.id);
    const ordre = [], vus = new Set([venue]);
    for (let n = 0; n < 500; n++) {
      const r = aretes.find(k => !vus.has(k) && (k.x === e || k.y === e));
      if (!r) break;
      vus.add(r);
      const entree = e;
      e = r.x === e ? r.y : r.x;
      if (r.dip) { if (r.dip === G.id) break; ordre.push({ id: r.dip, entree: entree.split('.')[1] }); }
    }
    if (vus.size !== aretes.length) return { ok: false, diag: T.morceaux };
    return { ok: true, dips: ordre, choisis: Array.from(S) };
  }

  // une boucle principale possible (pour « Afficher le montage ») : la plus courte qui contient le générateur
  function boucleParDefaut(c) {
    const gr = graphe(c), G = gr.G;
    const ar = gr.aretes.filter(e => e.id !== G.id && gr.dip(e.id).type !== 'voltmetre');
    // parcours en largeur sur les sommets, du + au −
    const prec = { [gr.plus]: null }, file = [gr.plus];
    while (file.length) {
      const s = file.shift();
      if (s === gr.moins) break;
      ar.forEach(e => {
        const t = e.u === s ? e.v : e.v === s ? e.u : null;
        if (t != null && !(t in prec)) { prec[t] = [s, e.id]; file.push(t); }
      });
    }
    const dips = [];
    for (let s = gr.moins; prec[s]; s = prec[s][0]) dips.unshift(prec[s][1]);
    // fils : ceux qui relient les extrémités successives
    const ids = new Set([G.id].concat(dips));
    const ext = [G.id + '.' + plusDe(G)];
    let s = gr.plus;
    dips.forEach(id => { const e = gr.aretes.find(x => x.id === id), entree = e.u === s ? 'a' : 'b'; ext.push(id + '.' + entree); ext.push(id + '.' + (entree === 'a' ? 'b' : 'a')); s = entree === 'a' ? e.v : e.u; });
    ext.push(G.id + '.' + (plusDe(G) === 'a' ? 'b' : 'a'));
    for (let k = 0; k < ext.length; k += 2) gr.chemin(ext[k], ext[k + 1]).forEach(f => ids.add(f));
    return Array.from(ids);
  }

  /* ============================================================
     CALCUL DU CIRCUIT DE LA TABLE (analyse nodale modifiée)
     ============================================================ */
  function resoudreLin(A, z) {
    const n = z.length;
    for (let i = 0; i < n; i++) {
      let p = i;
      for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
      [A[i], A[p]] = [A[p], A[i]]; [z[i], z[p]] = [z[p], z[i]];
      if (Math.abs(A[i][i]) < 1e-15) continue;
      for (let k = i + 1; k < n; k++) {
        const f = A[k][i] / A[i][i];
        if (!f) continue;
        for (let j = i; j < n; j++) A[k][j] -= f * A[i][j];
        z[k] -= f * z[i];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = z[i];
      for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
      x[i] = Math.abs(A[i][i]) < 1e-15 ? 0 : s / A[i][i];
    }
    return x;
  }
  const filSur = (scene, ref) => scene.fils.some(f => f[0] === ref || f[1] === ref);
  const entreeA = (scene, m) => filSur(scene, m.id + '.10A') ? '10A' : filSur(scene, m.id + '.mA') ? 'mA' : null;

  // tensions de chaque borne (référence : borne − du générateur) et intensités ; met à jour l'état du matériel
  function calculer(scene) {
    const par = {};
    const f = x => { if (par[x] == null) par[x] = x; while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    const bornes = [];
    scene.materiel.forEach(m => Object.keys(descMat(m).bornes).forEach(b => { bornes.push(m.id + '.' + b); f(m.id + '.' + b); }));
    scene.fils.forEach(([p, q]) => { par[f(p)] = f(q); });
    scene.materiel.forEach(m => { if (m.type === 'interrupteur' && m.ferme) par[f(m.id + '.1')] = f(m.id + '.2'); });
    const masse = f('G.moins');
    const idx = {};
    let n = 0;
    bornes.forEach(b => { const r = f(b); if (r !== masse && idx[r] == null) idx[r] = n++; });
    const I = b => idx[f(b)];
    const resist = [], sources = [];
    scene.materiel.forEach(m => {
      if (m.type === 'resistance') resist.push([m.id, m.valeur]);
      if (m.type === 'lampe') resist.push([m.id, R_LAMPE]);
      if (m.type === 'moteur') resist.push([m.id, R_MOTEUR]);
      if (m.type === 'generateur') sources.push({ id: m.id, p: 'G.plus', q: 'G.moins', e: m.tension || 0 });
      if (m.type === 'multimetre') { const ea = entreeA(scene, m); if (ea && filSur(scene, m.id + '.COM')) sources.push({ id: m.id, p: m.id + '.' + ea, q: m.id + '.COM', e: 0 }); }
    });
    const dels = scene.materiel.filter(m => m.type === 'del'), on = {};
    let sol = null, tours = 0;
    while (tours++ < 6) {
      const src = sources.concat(dels.filter(d => on[d.id]).map(d => ({ id: d.id, p: d.id + '.1', q: d.id + '.2', e: SEUIL_DEL })));
      const N = n + src.length, A = Array.from({ length: N }, () => new Array(N).fill(0)), z = new Array(N).fill(0);
      for (let i = 0; i < n; i++) A[i][i] += 1e-9;
      resist.forEach(([id, r]) => {
        const i = I(id + '.1'), j = I(id + '.2'), g = 1 / r;
        if (i != null) A[i][i] += g;
        if (j != null) A[j][j] += g;
        if (i != null && j != null) { A[i][j] -= g; A[j][i] -= g; }
      });
      src.forEach((s, k) => {
        const i = I(s.p), j = I(s.q), r = n + k;
        if (i != null) { A[i][r] += 1; A[r][i] += 1; }
        if (j != null) { A[j][r] -= 1; A[r][j] -= 1; }
        z[r] = s.e;
      });
      const x = resoudreLin(A, z);
      const V = b => { const i = I(b); return i == null ? 0 : x[i]; };
      const Is = {};
      src.forEach((s, k) => { Is[s.id] = x[n + k]; });
      sol = { V, Is };
      let change = false;
      dels.forEach(d => {
        if (on[d.id] && Is[d.id] < -1e-9) { on[d.id] = false; change = true; }
        else if (!on[d.id] && V(d.id + '.1') - V(d.id + '.2') > SEUIL_DEL + 1e-9) { on[d.id] = true; change = true; }
      });
      if (!change) break;
    }
    const res = { V: {}, I: {} };
    bornes.forEach(b => { res.V[b] = sol.V(b); });
    resist.forEach(([id, r]) => { res.I[id] = (sol.V(id + '.1') - sol.V(id + '.2')) / r; });
    Object.assign(res.I, sol.Is);
    // état du matériel
    scene.materiel.forEach(m => {
      if (m.type === 'lampe') { const p = R_LAMPE * res.I[m.id] ** 2; m.eclat = p > .03 ? Math.min(1, p / P_LAMPE) : 0; }
      if (m.type === 'moteur') { const i = res.I[m.id]; m.tourne = Math.abs(i) > .03 ? Math.sign(i) : 0; m.duree = Math.max(.15, Math.min(1.5, .5 * .075 / Math.max(Math.abs(i), .01))); }
      if (m.type === 'del') m.allumee = !!on[m.id];
      if (m.type === 'multimetre') Object.assign(m, lecture(scene, m, res));
    });
    return res;
  }

  // lecture d'un multimètre : texte de l'écran, valeur (unités SI), unité, dépassement
  function lecture(scene, m, res) {
    const p = posDe(m.position);
    if (p.id === 'OFF') return { affiche: '', mesure: null };
    const fils = b => filSur(scene, m.id + '.' + b);
    let v = 0, unite = '', si = 0;
    if (p.zone === 'A⎓') {
      const ea = entreeA(scene, m);
      si = ea === p.entree && fils('COM') ? (res.I[m.id] || 0) : 0;
      v = si * (p.k || 1); unite = p.k ? 'mA' : 'A';
    } else if (p.zone === 'V⎓') {
      si = fils('V') && fils('COM') ? res.V[m.id + '.V'] - res.V[m.id + '.COM'] : 0;
      v = si * (p.k || 1); unite = p.k ? 'mV' : 'V';
    } else if (p.zone === 'Ω') return { affiche: 'OL', mesure: null };
    else { v = 0; unite = p.zone[0] === 'V' ? 'V' : 'A'; }
    if (Math.abs(v) >= p.max) return { affiche: (v < 0 ? '-' : '') + 'OL', mesure: { depasse: true, zone: p.zone } };
    let t = v.toFixed(p.dec);
    if (/^-0\.?0*$/.test(t)) t = t.slice(1);
    return { affiche: t, mesure: { v: parseFloat(t), si, unite, zone: p.zone, texte: fr(parseFloat(t), p.dec) + ' ' + unite } };
  }

  /* ============================================================
     POSTE DE MONTAGE : schéma + table + consigne + déroulé, gestes dans l'ordre (ETAPES)
     ============================================================ */
  function monter(zone, c, opts) {
    opts = Object.assign({ boucle: true, com: false, mesures: 'lire', tensionReglee: false, rendu: 'relief' }, opts || {});
    const T = Object.assign({}, TEXTES, opts.textes || {});
    const gr = graphe(c);
    const sch = id => gr.dip(id);
    // nom d'un dipôle du schéma ; « l'ampèremètre » tout court s'il est le seul de son type
    const nomS = id => { const d = sch(id); return ['amperemetre', 'voltmetre'].includes(d.type) && c.dipoles.filter(x => x.type === d.type).length === 1 ? NOMS[d.type]({}) : nomDe(d); };
    zone.classList.add('mt-poste-z');
    zone.innerHTML = `<div class="mt-poste">
        <div class="mt-poste-schema"><div class="mt-schema-z"></div><div class="mt-consigne" aria-live="polite"></div></div>
        <div class="mt-poste-table"><div class="mt-table-z"></div></div>
      </div><ol class="mt-deroule"></ol><div class="mt-resultats"></div>`;
    const zSch = zone.querySelector('.mt-schema-z'), zCons = zone.querySelector('.mt-consigne'), zTab = zone.querySelector('.mt-table-z');
    zone.querySelector('.mt-poste-schema').style.setProperty('--ratio', (c.vb[c.vb.length - 2] / c.vb[c.vb.length - 1]).toFixed(3));

    // ---------- matériel de la table : un objet par dipôle du schéma ----------
    function materielInitial() {
      const l = [{ id: 'G', type: 'generateur', tension: opts.tensionReglee ? c.tension : 0, sorte: 'generateur' }];
      let k = 0;
      c.dipoles.filter(d => genre(d.type) === 'multimetre').forEach(() => l.push({ id: 'M' + (++k), type: 'multimetre', position: 'OFF', sorte: 'multimetre' }));
      let plaq = c.dipoles.filter(d => !['generateur', 'amperemetre', 'voltmetre'].includes(d.type));
      if (c.table) plaq = c.table.map(id => sch(id));
      else plaq = plaq.map(d => [Math.random(), d]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
      plaq.forEach((d, i) => l.push({ id: 'P' + (i + 1), type: d.type, valeur: d.valeur, ferme: false, sorte: sorte(d) }));
      return l;
    }

    let st, vSch, vTab, etapes, auto = false;

    function init() {
      const materiel = materielInitial();
      st = {
        phase: opts.boucle ? 'boucle' : 'fils',
        choisis: [], boucle: [], diagBoucle: null, cerne: null,
        vx: {}, assign: { [gr.G.id]: 'G' }, rassign: { G: gr.G.id },
        chaines: [], ci: 0, faitesDeriv: 0, built: new Set(), pos: {},
        branches: [], allumes: [], histo: [], montre: false, delQ: null, info: null,
        scene: { W: 360, H: 400, materiel, fils: [] },
      };
      st.vx['G.plus'] = gr.plus; st.vx['G.moins'] = gr.moins;
      if (!opts.boucle) choisirBoucle(verifierBoucle(c, boucleParDefaut(c)));
      if (vTab) vTab.detruire();
      vSch = schema(zSch, c, { com: opts.com, libre: opts.boucle, onTouche: toucheSchema });
      vTab = table(zTab, st.scene, { rendu: opts.rendu, onFil: (p, q) => { if (!auto) fil(p, q); }, onRetirer: i => { if (!auto) retirer(i); }, onFilTouche,
        onCommande: (id, nom, v) => { if (!auto) commande(id, nom, v); }, retirable: i => i === st.scene.fils.length - 1 && st.phase !== 'boucle' && !st.deplaces?.has(i),
        onLargeur: l => { const W = l >= 520 ? 540 : 360; if (W !== st.scene.W || !st.scene.place) { st.scene.W = W; st.scene.H = disposer(st.scene.materiel, W); st.scene.place = true; } } });
      creerEtapes();
      maj();
    }

    // ---------- étapes ----------
    function nbFils() {
      // chaque chaîne de n dipôles demande n + 1 fils : (arêtes hors générateur) + (nombre de chaînes)
      const E = c.dipoles.length - 1, Vs = new Set(gr.aretes.flatMap(e => [e.u, e.v])).size;
      return E + (E + 1 - Vs + 1);
    }
    const aMesurer = () => c.dipoles.filter(d => genre(d.type) === 'multimetre');
    function creerEtapes() {
      const l = [];
      const filE = k => ({ id: 'fil' + k, type: 'fil', accepte: g => g.type === 'fil' && g.ok, refus: g => (g.type === 'fil' && g.msg) || null });
      if (opts.boucle) l.push({ id: 'boucle', accepte: g => g.type === 'boucle' && g.ok, refus: g => (g.type === 'boucle' && g.diag) || (g.type === 'fil' && g.msg) || null });
      for (let k = 1; k <= nbFils(); k++) l.push(filE(k));
      const finFils = { refus: g => (g.type === 'fil' && g.msg) || null };
      if (c.dipoles.some(d => d.type === 'interrupteur')) l.push(Object.assign({ id: 'interrupteur', accepte: () => st.scene.materiel.filter(m => m.type === 'interrupteur').every(m => m.ferme) }, finFils));
      if (!opts.tensionReglee) l.push(Object.assign({ id: 'generateur', accepte: () => Math.abs((mat('G').tension || 0) - c.tension) < .051 }, finFils));
      if (c.dipoles.some(d => d.type === 'del')) l.push(Object.assign({ id: 'del', accepte: () => st.scene.materiel.filter(m => m.type === 'del').every(m => m.allumee) }, finFils));
      if (opts.mesures === 'dixA') {
        const A = () => mat(st.assign[aMesurer()[0].id]);
        l.push(Object.assign({ id: 'cal10', accepte: () => A() && A().position === 'A10' && entreeA(st.scene, A()) === '10A' }, finFils));
        l.push(Object.assign({ id: 'versmA', accepte: () => A() && entreeA(st.scene, A()) === 'mA' }, finFils));
        l.push(Object.assign({ id: 'calmA', accepte: () => A() && ['A200m', 'A20m'].includes(A().position) && A().mesure && !A().mesure.depasse }, finFils));
      } else if (opts.mesures === 'lire' && aMesurer().length) {
        l.push(Object.assign({ id: 'mesures', accepte: () => aMesurer().every(d => lectureValide(d)) }, finFils));
      }
      etapes = ETAPES.creer({ etapes: l, onFin: fin });
    }
    // lecture correcte : bonne fonction, calibre adapté (ampèremètre : entrée mA s'il le faut ; voltmètre : plus petit calibre possible)
    // lecture correcte : bonne fonction, sans dépassement, et précise (au moins 3 chiffres significatifs, ou le meilleur calibre possible)
    function lectureValide(d) {
      const m = mat(st.assign[d.id]);
      if (!m || !m.mesure || m.mesure.depasse) return false;
      const p = posDe(m.position), res = st.res;
      const chiffres = String(m.affiche).replace(/[-.]/g, '').replace(/^0+/, '').length;
      if (d.type === 'amperemetre') {
        if (p.zone !== 'A⎓') return false;
        const i = Math.abs(res.I[m.id] || 0);
        return chiffres >= 3 || (i < .2 ? p.entree === 'mA' : p.id === 'A10');
      }
      if (p.zone !== 'V⎓') return false;
      return chiffres >= 3 || p.id === meilleurV(m);
    }
    const meilleurV = m => { const u = Math.abs(st.res.V[m.id + '.V'] - st.res.V[m.id + '.COM']); return ['V200m', 'V2', 'V20', 'V200', 'V600'].find(id => { const q = posDe(id); return u * (q.k || 1) < q.max * .9995; }); };
    const mat = id => st.scene.materiel.find(m => m.id === id);

    // ---------- boucle principale (sur le schéma) ----------
    function toucheSchema(cible) {
      if (auto || st.phase !== 'boucle' || (cible.type !== 'fil' && cible.type !== 'dipole')) return;
      const i = st.choisis.indexOf(cible.id);
      if (i >= 0) st.choisis.splice(i, 1); else st.choisis.push(cible.id);
      st.diagBoucle = null; st.cerne = null;
      maj();
    }
    function verifier() {
      const r = verifierBoucle(c, st.choisis, opts.textes);
      const res = etapes.proposer(Object.assign({ type: 'boucle' }, r));
      if (!res.accepte) { st.diagBoucle = r.diag; st.cerne = r.cerne || null; maj(); return; }
      st.diagBoucle = null; st.cerne = null; st.info = T.boucleOk;
      choisirBoucle(r);
      maj();
    }
    function choisirBoucle(r) {
      st.boucle = r.choisis;
      st.phase = 'fils';
      // chaîne de la boucle : sommets successifs depuis la borne +
      const dips = r.dips.map(x => x.id), sommets = [gr.plus];
      let s = gr.plus;
      dips.forEach(id => { const e = gr.aretes.find(x => x.id === id); s = e.u === s ? e.v : e.u; sommets.push(s); });
      st.chaines = [{ type: 'boucle', dips, sommets, sens: 0, k: 0, bout: null }];
      st.ci = 0;
      sommets.forEach(x => st.built.add(x));
    }
    // dérivations restantes : chaînes de dipôles entre deux sommets déjà construits, dans l'ordre du schéma
    function prochaineDerivation() {
      const utilises = new Set([gr.G.id].concat(st.chaines.flatMap(ch => ch.dips)));
      const libres = gr.aretes.filter(e => !utilises.has(e.id));
      const cands = [];
      libres.forEach(e0 => [e0.u, e0.v].forEach(s0 => {
        if (!st.built.has(s0)) return;
        const dips = [e0.id], sommets = [s0];
        let s = e0.u === s0 ? e0.v : e0.u, ok = true;
        while (!st.built.has(s)) {
          sommets.push(s);
          const suite = libres.filter(e => !dips.includes(e.id) && (e.u === s || e.v === s));
          if (suite.length !== 1) { ok = false; break; }
          dips.push(suite[0].id);
          s = suite[0].u === s ? suite[0].v : suite[0].u;
        }
        sommets.push(s);
        if (ok) cands.push({ type: 'deriv', dips, sommets, sens: 0, k: 0, bout: null });
      }));
      if (!cands.length) return null;
      const P = x => st.pos[x] == null ? 99 : st.pos[x];
      // chaque dérivation est orientée depuis son nœud le plus proche de la borne de départ
      cands.forEach(k => { if (P(k.sommets[0]) > P(k.sommets[k.sommets.length - 1])) { k.dips.reverse(); k.sommets.reverse(); } });
      const G0 = gr.G;
      const cle = ch => [Math.min(P(ch.sommets[0]), P(ch.sommets[ch.sommets.length - 1])), Math.max(P(ch.sommets[0]), P(ch.sommets[ch.sommets.length - 1])),
        Math.min(...ch.dips.map(id => Math.hypot(sch(id).x - G0.x, sch(id).y - G0.y)))];
      // d'abord le nœud de départ le plus proche de la borne de départ, puis la dérivation la plus proche du générateur sur le schéma
      cands.sort((x, y) => { const p = cle(x), q = cle(y); return p[0] - q[0] || p[2] - q[2] || p[1] - q[1]; });
      return cands[0];
    }

    // ---------- fils proposés sur la table ----------
    const itemDe = ref => mat(ref.split('.')[0]);
    const nbFilsSur = ref => st.scene.fils.filter(f => f[0] === ref || f[1] === ref).length;
    const complement = (ref, type) => {
      const [t, b] = ref.split('.');
      if (type === 'amperemetre') return t + '.' + (b === 'COM' ? '10A' : 'COM');
      if (type === 'voltmetre') return t + '.' + (b === 'COM' ? 'V' : 'COM');
      return t + '.' + (b === '1' ? '2' : '1');
    };
    // la borne y convient-elle pour entrer dans le dipôle id du schéma ?
    function convient(y, id) {
      const m = itemDe(y), d = sch(id), b = y.split('.')[1];
      if (!m || m.type === 'generateur') return { ok: false };
      if (st.rassign[m.id] ? st.rassign[m.id] !== id : (st.assign[id] ? st.assign[id] !== m.id : m.sorte !== sorte(d))) return { ok: false };
      if (nbFilsSur(y)) return { ok: false };
      if (d.type === 'amperemetre' && !['10A', 'COM'].includes(b)) return { ok: false, msg: T.dixA };
      if (d.type === 'voltmetre' && !['V', 'COM'].includes(b)) return { ok: false, msg: T.voltBornes };
      return { ok: true };
    }
    const ch = () => st.chaines[st.ci];
    const prochainDip = c0 => (c0.k < c0.dips.length ? (c0.sens === 1 ? c0.dips[c0.k] : c0.dips[c0.dips.length - 1 - c0.k]) : null);
    const finChaine = c0 => (c0.sens === 1 ? c0.sommets[c0.sommets.length - 1] : c0.sommets[0]);
    const numDeriv = n => ['première', 'deuxième', 'troisième', 'quatrième'][n] || 'suivante';
    const nomBout = c0 => { const m = itemDe(c0.bout); return m.type === 'generateur' ? (c0.bout === 'G.plus' ? 'la borne + du générateur' : 'la borne − du générateur') : nomS(st.rassign[m.id]); };
    // nœud du schéma au sommet s (pour le cercler), et ses voisins dans la boucle
    function noeudDe(s) { const n = (c.noeuds || []).find(x => gr.sommet(x.id) === s); return n ? n.id : null; }
    function noeudVers(e) {
      const estN = x => (c.noeuds || []).some(n => n.id === x), vus = new Set([e]), file = [e];
      while (file.length) {
        const x = file.shift();
        if (estN(x)) return x;
        c.fils.forEach(w => { const y = w.a === x ? w.b : w.b === x ? w.a : null; if (y && !vus.has(y)) { vus.add(y); file.push(y); } });
      }
      return null;
    }
    // nœud de départ (sur le schéma) de la dérivation c0
    const noeudDebut = c0 => { const s0 = c0.sens === -1 ? c0.sommets[c0.sommets.length - 1] : c0.sommets[0], d = c0.sens === -1 ? c0.dips[c0.dips.length - 1] : c0.dips[0];
      const e = ['a', 'b'].map(t => d + '.' + t).find(x => gr.sommet(x) === s0); return (e && noeudVers(e)) || noeudDe(s0); };
    function voisins(s) {
      const b = st.chaines[0], i = b.sommets.indexOf(s);
      if (i < 0) return '';
      const av = i === 0 ? 'la borne + du générateur' : nomS(b.dips[i - 1]), ap = i === b.dips.length ? 'la borne − du générateur' : nomS(b.dips[i]);
      return `entre ${av} et ${ap}`;
    }

    function evaluer(p, q) {
      const P = itemDe(p), Q = itemDe(q);
      // court-circuit
      const vp = st.vx[p], vq = st.vx[q];
      const gpm = x => x === gr.plus ? 1 : x === gr.moins ? -1 : 0;
      if ((p.startsWith('G.') && q.startsWith('G.')) || (vp && vq && gpm(vp) * gpm(vq) === -1)) return { msg: T.court, borne: q };
      if (st.phase === 'boucle') return { msg: T.boucleDabordSchema, borne: q };
      if (st.phase !== 'fils') return { msg: T.fini, borne: q };
      const c0 = ch();
      if (!c0.bout) {
        for (const [x, y] of [[p, q], [q, p]]) {
          for (const sens of [1, -1]) {
            const s0 = sens === 1 ? c0.sommets[0] : c0.sommets[c0.sommets.length - 1];
            const d0 = sens === 1 ? c0.dips[0] : c0.dips[c0.dips.length - 1];
            if (st.vx[x] !== s0) continue;
            if (c0.type === 'boucle' && !x.startsWith('G.')) continue;
            const r = convient(y, d0);
            if (r.ok) return { ok: true, x, y, sens, dip: d0 };
            if (r.msg) return { msg: r.msg, borne: y };
          }
        }
        return diagnostic(p, q, c0, null);
      }
      for (const [x, y] of [[p, q], [q, p]]) {
        if (x !== c0.bout) continue;
        const d = prochainDip(c0);
        if (!d) { if (st.vx[y] === finChaine(c0)) return { ok: true, x, y, fin: true }; continue; }
        const r = convient(y, d);
        if (r.ok) return { ok: true, x, y, dip: d };
        if (r.msg) return { msg: r.msg, borne: y };
      }
      return diagnostic(p, q, c0, c0.bout);
    }
    function diagnostic(p, q, c0, bout) {
      const autre = bout === p ? q : bout === q ? p : q;
      const pas = st.chaines.length && c0.type === 'boucle' && !c0.bout;
      if (pas && !p.startsWith('G.') && !q.startsWith('G.')) return { msg: T.depart, borne: p };
      // ampèremètre : un deuxième fil sur une borne déjà reliée le mettrait en dérivation
      for (const x of [p, q]) {
        const m = itemDe(x), dId = m && st.rassign[m.id];
        if (dId && sch(dId).type === 'amperemetre' && x !== bout && nbFilsSur(x)) return { msg: T.serieA, borne: x };
      }
      // deux fils sur une borne là où le schéma n'a pas de nœud
      for (const y of [p, q]) if (y !== bout && nbFilsSur(y) && !gr.jonction(st.vx[y])) return { msg: T.noeud, borne: y };
      const M = itemDe(autre);
      // dipôle d'une dérivation pendant la boucle, ou d'une autre dérivation
      const restants = c0.dips.filter(id => !st.assign[id] || st.assign[id] === M.id).map(id => sorte(sch(id)));
      if (M.type !== 'generateur' && !restants.includes(M.sorte) && !st.rassign[M.id]) {
        if (c0.type === 'boucle') {
          // depuis le bout de la boucle vers un voltmètre : il serait en série ; ailleurs : dérivation commencée trop tôt
          const volt = M.type === 'multimetre' && c.dipoles.some(d => d.type === 'voltmetre') && bout && [p, q].includes(bout);
          return { msg: volt ? T.voltSerie : T.boucleDabord, borne: autre };
        }
        const s0 = c0.sens === -1 ? c0.sommets[c0.sommets.length - 1] : c0.sommets[0];
        st.cerne = noeudDebut(c0);
        return { msg: T.ordreDeriv(numDeriv(st.faitesDeriv), voisins(s0)), borne: autre };
      }
      if (c0.type === 'deriv' && !c0.bout) {
        const s0 = c0.sommets[0];
        st.cerne = noeudDebut(c0);
        return { msg: T.ordreDeriv(numDeriv(st.faitesDeriv), voisins(s0)), borne: autre };
      }
      if (!bout) {
        const g = [p, q].find(x => x.startsWith('G.'));
        if (g && c0.type === 'boucle') {
          const d0 = g === 'G.plus' ? c0.dips[0] : c0.dips[c0.dips.length - 1];
          return { msg: T.premier(g === 'G.plus' ? 'la borne + du générateur' : 'la borne − du générateur', nomS(d0)), borne: autre };
        }
        return { msg: T.depart, borne: p };
      }
      const d = prochainDip(c0), x = nomBout(c0);
      if (!d) {
        if (c0.type === 'boucle') return { msg: T.fermer(x), borne: autre };
        const dl = c0.sens === -1 ? c0.dips[0] : c0.dips[c0.dips.length - 1], el = ['a', 'b'].map(t => dl + '.' + t).find(e => gr.sommet(e) === finChaine(c0));
        st.cerne = (el && noeudVers(el)) || noeudDe(finChaine(c0));
        return { msg: T.rejoindre(x), borne: autre };
      }
      return { msg: T.suivant(x, nomS(d)), borne: autre };
    }

    function fil(p, q) {
      st.info = null; st.cerne = null;
      // déplacement d'une fiche sur un même multimètre (10A ↔ mA)
      const [tp, bp] = p.split('.'), [tq, bq] = q.split('.');
      if (tp === tq && itemDe(p).type === 'multimetre' && ['10A', 'mA'].includes(bp) && ['10A', 'mA'].includes(bq)) {
        const [de0, vers] = nbFilsSur(p) ? [p, q] : [q, p];
        if (!nbFilsSur(de0) || nbFilsSur(vers)) return;
        if (st.phase === 'boucle' || st.phase === 'fils') { vTab.refus(vers, T.finirDabord); return; }
        // première fois (mesures « dixA ») : on lit d'abord l'intensité au calibre 10 A
        const e0 = etapes.courante();
        if (opts.mesures === 'dixA' && vers.endsWith('.mA') && e0 && ['interrupteur', 'generateur', 'del', 'cal10'].includes(e0.id)) { vTab.refus(vers, `<b>Pas encore.</b> ${T.dixA}`); return; }
        const i = st.scene.fils.findIndex(f => f.includes(de0));
        st.scene.fils[i] = st.scene.fils[i].map(x => (x === de0 ? vers : x));
        st.vx[vers] = st.vx[de0]; delete st.vx[de0];
        st.deplaces = st.deplaces || new Set(); st.deplaces.add(i);
        apresChangement();
        return;
      }
      const r = evaluer(p, q);
      const res = etapes.proposer(Object.assign({ type: 'fil' }, r));
      if (!res.accepte) {
        if (r.msg) vTab.refus(r.borne, `<b>Ce n'est pas ça.</b> ${r.msg}`);
        if (opts.onChange) opts.onChange(api);
        maj();
        return;
      }
      poser(r);
    }
    function poser(r) {
      st.histo.push(JSON.stringify({ vx: st.vx, assign: st.assign, rassign: st.rassign, chaines: st.chaines, ci: st.ci, faitesDeriv: st.faitesDeriv,
        built: Array.from(st.built), pos: st.pos, branches: st.branches, allumes: st.allumes, phase: st.phase }));
      const c0 = ch();
      st.scene.fils.push([r.x, r.y]);
      // fils du schéma colorés : chemin entre la borne de départ et la borne d'arrivée, au même sommet
      const sx = st.vx[r.x];
      const ext = ref => { const m = itemDe(ref), id = st.rassign[m.id]; const d = sch(id); return ['a', 'b'].map(t => id + '.' + t).find(e => gr.sommet(e) === st.vx[ref]) || (d && id + '.a'); };
      if (r.fin) {
        st.branches.push(...gr.chemin(ext(r.x), ext(r.y)));
        if (c0.type === 'deriv') { const n = noeudVers(ext(r.x)); if (n && !st.allumes.includes(n)) st.allumes.push(n); }
        c0.bout = null; c0.fini = true;
        if (c0.type === 'deriv') st.faitesDeriv++;
        // positions des sommets le long de la boucle, depuis la borne de départ
        if (c0.type === 'boucle') c0.sommets.forEach((s, i) => { st.pos[s] = c0.sens === 1 ? i : c0.sommets.length - 1 - i; });
        else c0.sommets.slice(1, -1).forEach(s => { st.pos[s] = Math.min(st.pos[c0.sommets[0]], st.pos[c0.sommets[c0.sommets.length - 1]]) + .5; st.built.add(s); });
        const n = prochaineDerivation();
        if (n) { st.chaines.push(n); st.ci++; } else st.phase = 'reglages';
      } else {
        if (!c0.sens) c0.sens = r.sens;
        const m = itemDe(r.y);
        st.assign[r.dip] = m.id; st.rassign[m.id] = r.dip;
        // sommets : entrée du dipôle (côté départ) et sortie
        const i = c0.sens === 1 ? c0.k : c0.dips.length - 1 - c0.k;
        const sEnt = c0.sens === 1 ? c0.sommets[i] : c0.sommets[i + 1], sSor = c0.sens === 1 ? c0.sommets[i + 1] : c0.sommets[i];
        st.vx[r.y] = sEnt;
        c0.bout = complement(r.y, sch(r.dip).type);
        st.vx[c0.bout] = sSor;
        c0.k++;
        st.branches.push(r.dip);
        if (!st.branches.includes(gr.G.id)) st.branches.push(gr.G.id);
        if (sx != null) {
          st.branches.push(...gr.chemin(ext(r.x), ext(r.y)));
          if (c0.type === 'deriv' && c0.k === 1) { const n = noeudVers(ext(r.y)); if (n && !st.allumes.includes(n)) st.allumes.push(n); }
        }
      }
      apresChangement(true);
    }
    function retirer(i) {
      if (i !== st.scene.fils.length - 1 || !st.histo.length) return;
      const h = JSON.parse(st.histo.pop());
      Object.assign(st, h, { built: new Set(h.built) });
      st.scene.fils.pop();
      etapes.reculer('fil' + (st.scene.fils.length + 1));
      st.delQ = null;
      apresChangement();
    }
    function onFilTouche() { st.info = T.retirerDernier; maj(); }
    function commande(id, nom, v) {
      const m = mat(id);
      if (nom === 'levier') m.ferme = !m.ferme;
      if (nom === 'position') m.position = v;
      if (nom === 'tension') m.tension = v;
      apresChangement();
    }
    function apresChangement() {
      st.res = calculer(st.scene);
      etapes.verifier();
      maj();
      if (opts.onChange) opts.onChange(api);
    }
    function fin() { maj(); }

    // ---------- affichage ----------
    function maj() {
      if (!st.res) st.res = calculer(st.scene);
      // étiquettes des appareils de mesure
      st.scene.materiel.forEach(m => { if (m.type === 'multimetre') { const d = st.rassign[m.id] && sch(st.rassign[m.id]); m.etiquette = d && d.mesure ? (d.type === 'amperemetre' ? 'A · ' : 'V · ') + indice(d.mesure).replace(/<\/?sub>/g, '') : ''; } });
      const etats = {};
      c.dipoles.forEach(d => {
        const m = st.assign[d.id] && mat(st.assign[d.id]);
        if (d.type === 'interrupteur') etats[d.id] = { ouvert: !(m && m.ferme) };
        if (d.type === 'lampe') etats[d.id] = { allumee: !!(m && m.eclat) };
      });
      vSch.maj({ libre: st.phase === 'boucle' && !auto, choisis: st.phase === 'boucle' ? st.choisis : [], boucle: st.boucle, branches: st.branches,
                 allumes: st.allumes, cerne: st.cerne, etats });
      vTab.dessiner();
      consigne();
      deroule();
    }
    function consigne() {
      const e = etapes.courante();
      let h = '';
      if (!e) {
        h = `<p class="mt-ok"><b>Juste !</b> ${T.fin}</p>${resultatsHTML()}`;
      } else if (e.id === 'boucle') {
        h = `<p>${T.cBoucle}</p><div class="mt-cons-actions"><button type="button" class="btn-small" data-a="verifier"${auto ? ' disabled' : ''}>Vérifier</button></div>`;
        if (st.diagBoucle) h += `<div class="callout-danger mt-diag"><b>Ce n'est pas ça.</b> ${st.diagBoucle}</div>`;
      } else if (e.type === 'fil') {
        const c0 = ch();
        if (!c0) h = '';
        else if (c0.type === 'boucle') h = !c0.bout ? T.cDepart : prochainDip(c0) ? T.cSuite(nomBout(c0)) : T.cFermer(nomBout(c0));
        else h = !c0.bout ? T.cDeriv(numDeriv(st.faitesDeriv)) : T.cDerivSuite(nomBout(c0));
        h = `<p>${h}</p>`;
      } else if (e.id === 'interrupteur') h = `<p>${T.cInterrupteur}</p>`;
      else if (e.id === 'generateur') h = `<p>${T.cGenerateur(c.tension)}</p>`;
      else if (e.id === 'del') h = delHTML();
      else if (e.id === 'cal10') h = `<p>${T.cCal10}</p>`;
      else if (e.id === 'versmA') { const m = mat(st.assign[aMesurer()[0].id]); h = `<p>${T.cVersmA(m.affiche)}</p>`; }
      else if (e.id === 'calmA') h = `<p>${T.cCalmA}</p>`;
      else if (e.id === 'mesures') h = `<p>${T.cMesures(aMesurer().map(d => indice(d.mesure || '')))}</p>${resultatsHTML(true)}`;
      if (st.info) h = `<p class="mt-info">${st.info}</p>` + h;
      zCons.innerHTML = h;
      const b = zCons.querySelector('[data-a="verifier"]');
      if (b) b.onclick = verifier;
      zCons.querySelectorAll('[data-del]').forEach(x => { x.onclick = () => { st.delQ = +x.dataset.del; maj(); }; });
    }
    function delHTML() {
      if (st.delQ === 0) return `<div class="callout-success mt-diag">${T.delRep}</div>`;
      return `<p><b>${T.cDel}</b> ${T.delQ}</p><div class="mt-choix">${T.delChoix.map((t, i) => `<button type="button" class="btn-secondary" data-del="${i}">${t}</button>`).join('')}</div>
        ${st.delQ ? `<div class="callout-danger mt-diag">${T.delFaux}</div>` : ''}`;
    }
    function mesures() {
      const o = {};
      aMesurer().forEach(d => { const m = mat(st.assign[d.id]); if (m && m.mesure && !m.mesure.depasse) o[d.mesure || d.id] = m.mesure; });
      return o;
    }
    function resultatsHTML(partiel) {
      const l = aMesurer().filter(d => { const m = mat(st.assign[d.id]); return d.mesure && m && m.mesure && !m.mesure.depasse && (!partiel || lectureValide(d)); })
        .map(d => `<span>${indice(d.mesure)} = ${mat(st.assign[d.id]).mesure.texte}</span>`);
      return l.length ? `<p class="mt-mesures">${l.join('')}</p>` : '';
    }
    function deroule() {
      const ol = zone.querySelector('.mt-deroule'), faites = new Set(etapes.faites()), cour = etapes.courante();
      const nf = nbFils(), nb = st.chaines.length ? st.chaines[0].dips.length + 1 : (boucleParDefautN || nf);
      const grp = [];
      if (opts.boucle) grp.push(['Surligne la boucle principale sur le schéma.', ['boucle']]);
      const ids = k => Array.from({ length: k }, (_, i) => 'fil' + (i + 1));
      grp.push(['Réalise la boucle principale en partant d\'une borne du générateur (+ ou −), dans l\'ordre du schéma.', ids(nb - 1)]);
      grp.push(['Ferme la boucle sur l\'autre borne du générateur.', ['fil' + nb]]);
      if (nf > nb) grp.push(['Ajoute les dérivations une par une, dans l\'ordre du schéma.', ids(nf).slice(nb)]);
      const et = { interrupteur: 'Ferme l\'interrupteur.', generateur: `Règle le générateur sur ${fr(c.tension)} V.`, del: 'Vérifie que la DEL s\'éclaire.',
        cal10: 'Règle l\'ampèremètre sur le calibre 10 A et lis l\'intensité.', versmA: 'Passe la fiche de l\'entrée 10A à l\'entrée mA.', calmA: 'Règle le calibre sur 200 mA et lis l\'intensité.',
        mesures: 'Règle les appareils de mesure et lis les valeurs.' };
      Object.keys(et).forEach(id => { if (etapesIds.includes(id)) grp.push([et[id], [id]]); });
      ol.innerHTML = grp.filter(g => g[1].length).map(([t, l]) => {
        const fait = l.every(id => faites.has(id)), ici = cour && l.includes(cour.id);
        return `<li class="${fait ? 'fait' : ici ? 'ici' : 'avenir'}">${t}</li>`;
      }).join('');
    }
    let etapesIds = [], boucleParDefautN = 0;

    // ---------- « Afficher le montage » : tout se fait seul, fil par fil, au ralenti ----------
    function solutionSuivante() {
      if (st.phase === 'boucle') return () => { st.choisis = boucleParDefaut(c); maj(); setTimeout(verifier, 300); };
      if (st.phase === 'fils') {
        const c0 = ch();
        if (!c0.bout) {
          const sens = 1, s0 = c0.sommets[0], d0 = c0.dips[0];
          const x = c0.type === 'boucle' ? 'G.plus' : Object.keys(st.vx).find(b => st.vx[b] === s0 && !b.startsWith('G.') || (b === 'G.plus' && s0 === gr.plus) || (b === 'G.moins' && s0 === gr.moins));
          const y = bornePour(d0, sens);
          return () => fil(x, y);
        }
        const d = prochainDip(c0);
        if (!d) { const f0 = finChaine(c0); const y = Object.keys(st.vx).find(b => st.vx[b] === f0 && b !== c0.bout); return () => fil(c0.bout, y); }
        return () => fil(c0.bout, bornePour(d, c0.sens));
      }
      const e = etapes.courante();
      if (!e) {
        const d = (opts.montrerMesures || []).map(n => c.dipoles.find(x => x.mesure === n)).find(x => x && !lectureValide(x));
        return d ? reglerMesure(d) : null;
      }
      if (e.id === 'interrupteur') { const k = st.scene.materiel.find(m => m.type === 'interrupteur' && !m.ferme); return () => commande(k.id, 'levier'); }
      if (e.id === 'generateur') return () => commande('G', 'tension', c.tension);
      if (e.id === 'cal10') return () => commande(st.assign[aMesurer()[0].id], 'position', 'A10');
      if (e.id === 'versmA') { const m = st.assign[aMesurer()[0].id]; return () => fil(m + '.10A', m + '.mA'); }
      if (e.id === 'calmA') return () => commande(st.assign[aMesurer()[0].id], 'position', 'A200m');
      if (e.id === 'mesures') { const d = aMesurer().find(x => !lectureValide(x)); return d ? reglerMesure(d) : null; }
      return null;
    }
    // réglage d'un appareil de mesure : une action à la fois (fonction et calibre, fiche 10A → mA)
    function reglerMesure(d) {
      {
        const m = mat(st.assign[d.id]);
        if (d.type === 'voltmetre') return () => commande(m.id, 'position', meilleurV(m));
        if (Math.abs(st.res.I[m.id] || 0) >= .2) return () => commande(m.id, 'position', 'A10');
        if (entreeA(st.scene, m) === '10A') return () => fil(m.id + '.10A', m.id + '.mA');
        return () => commande(m.id, 'position', 'A200m');
      }
      return null;
    }
    // borne d'entrée choisie pour l'affichage automatique : 10A pour l'ampèremètre, V pour le voltmètre (COM du côté −),
    // anode de la DEL du côté +
    function bornePour(id, sens) {
      const d = sch(id);
      const m = st.assign[id] ? mat(st.assign[id]) : st.scene.materiel.find(x => !st.rassign[x.id] && x.sorte === sorte(d));
      const avant = sens === 1;
      if (d.type === 'amperemetre') return m.id + '.' + (avant ? '10A' : 'COM');
      if (d.type === 'voltmetre') return m.id + '.' + (avant ? 'V' : 'COM');
      if (d.type === 'del') return m.id + '.' + (avant ? '1' : '2');
      return m.id + '.1';
    }
    function montrer() {
      if (auto) return;
      auto = true; st.montre = true;
      vTab.actif(false);
      zone.classList.add('mt-auto');
      const pas = () => {
        const f = solutionSuivante();
        if (!f) { auto = false; zone.classList.remove('mt-auto'); vTab.actif(true); maj(); return; }
        f();
        setTimeout(pas, 750);
      };
      maj();
      setTimeout(pas, 300);
    }

    const api = {
      get refus() { return etapes.refus; },
      get montre() { return st.montre; },
      fini: () => etapes.fini(),
      mesures,
      mesure: nom => mesures()[nom] || null,
      montrer,
      recommencer() { init(); },
      get etapes() { return etapes; },
      get etat() { return st; },
      circuit: c,
    };
    // fin du montage : bilan
    const fin0 = fin;
    fin = function () { fin0(); if (opts.onFin) opts.onFin({ refus: etapes.refus, montre: st.montre, mesures: mesures() }); };
    init();
    etapesIds = etapes ? (function () { const l = []; ['interrupteur', 'generateur', 'del', 'cal10', 'versmA', 'calmA', 'mesures'].forEach(id => { if (aEtape(id)) l.push(id); }); return l; })() : [];
    function aEtape(id) {
      if (id === 'interrupteur') return c.dipoles.some(d => d.type === 'interrupteur');
      if (id === 'generateur') return !opts.tensionReglee;
      if (id === 'del') return c.dipoles.some(d => d.type === 'del');
      if (['cal10', 'versmA', 'calmA'].includes(id)) return opts.mesures === 'dixA';
      if (id === 'mesures') return opts.mesures === 'lire' && aMesurer().length > 0;
      return false;
    }
    boucleParDefautN = (verifierBoucle(c, boucleParDefaut(c)).dips || []).length + 1;
    maj();
    return api;
  }

  window.MONTAGE = { TEXTES, POSITIONS, libellePosition, schema, table, graphe, verifierBoucle, boucleParDefaut, calculer, lecture, monter, disposer, afficheur, MAT, nomDe, indice, borneSchema };
})();
