/* ============================================================
   MONTAGE : réaliser un montage électrique à partir d'un schéma
   (application « Réaliser un montage électrique », réutilisé par
   « Lois de l'électricité »). Styles : assets/montage.css (mt-, ms-).

   Deux vues synchronisées :
   - le schéma normalisé (symboles, nœuds, intensités et tensions nommées,
     boucle principale surlignée, éléments branchés colorés) ;
   - la table de montage vue de dessus (générateur, multimètres, oscilloscope,
     dipôles sur plaquette, fils souples tirés d'une borne à l'autre), matériel
     rangé en ligne comme sur la paillasse.
   Calcul des tensions et des intensités (générateur idéal réglable,
   résistances, lampes et moteur modélisés par des résistances, DEL à seuil
   de 2 V, interrupteur, ampèremètre de résistance nulle, voltmètre ouvert),
   affichage des multimètres selon la fonction, le calibre, l'entrée et le sens.

   ---------- Description d'un circuit (repère du schéma) ----------
   circuit = {
     vb: [largeur, hauteur],
     dipoles: [{ id, type, x, y, rot, valeur, nom, mesure, inverse, com }],
       type : generateur | resistance (valeur en Ω) | lampe | interrupteur | del | moteur | amperemetre | voltmetre
              | voie (voie de l'oscilloscope : voie 1 ou 2, dir 'haut'|'bas'|'gauche'|'droite' ; x, y : point
                où arrive la flèche CH1 ou CH2 ; borne 'a' : ce point ; borne 'b' : la masse, en masse: [x, y])
       bornes du symbole : 'a' (côté gauche avant rotation) et 'b' ;
       générateur : + en 'a' (inverse: true → + en 'b') ; DEL : anode (+) en 'a'
       nom : « la lampe L₁ » (sinon le nom du type) ; mesure : 'I_1', 'U_390' (appareils de mesure)
       com : ±1, côté de la borne COM (affiché avec l'option com)
     fils: [{ id, pts: [[x, y], …], a, b }],   a, b : 'R1.a', 'G.b' ou l'identifiant d'un nœud
     noeuds: [{ id, x, y }], croisements: [{ x, y }] (fils qui se croisent sans se toucher),
     intensites: [{ nom: 'I_1', x, y, dir: 'bas'|'haut'|'gauche'|'droite', cote }],
     tensions: [{ nom: 'U_G', x1, y1, x2, y2, cote }],
     masse: { x, y },                           point où est dessiné le symbole de masse de l'oscilloscope (une seule fois)
     sens: [2, 2],                              sensibilités des voies de l'oscilloscope (V/div)
     tension: 8,                                tension à régler sur le générateur (V)
     table: ['L2', 'K', 'L1'],                  ordre des plaquettes sur la table (sinon l'ordre du circuit, voir ordreSchema)
   }

   ---------- API ----------
   MONTAGE.schema(zone, circuit, options) → { maj(options), svg }
     options : boucle, branches, choisis, derivs, allumes, touches (identifiants), cerne (nœud ou dipôle
               entouré), com (vrai ou liste d'identifiants), etats ({ K: { ouvert }, L1: { allumee } }),
               libre (éléments à toucher), onTouche({ type: 'fil'|'dipole'|'noeud'|'croisement', id })
   MONTAGE.graphe(circuit)                       sommets (points électriques), arêtes (dipôles), jonctions
   MONTAGE.verifierBoucle(circuit, choisis)      { ok, dips, sommets } ou { ok: false, diag, cerne }
   MONTAGE.calculer(scene)                       tensions des bornes, intensités, et état du matériel
   MONTAGE.lireValeur(texte)                     « 16,3 mA » → { v (unités SI), famille: 'A' | 'V' } ou null
   MONTAGE.monter(zone, circuit, options) → poste de montage complet (schéma, table, consigne, déroulé) :
     options = {
       mode: 'monter',            'monter' : réaliser tout le montage, puis l'allumer pour le vérifier ;
                                  'mesurer' : le circuit est déjà monté et allumé, on y ajoute les appareils
                                  de mesure (ampèremètre : à la place d'un fil débranché), on les règle, on lit ;
                                  une voie de l'oscilloscope se branche seulement (fiche rouge et fiche noire)
       boucle: false,             (monter) repérer d'abord la boucle principale sur le schéma ; sinon
                                  la boucle principale est celle que l'élève réalise
       mesurer: ['A', 'V'],       (mesurer) appareils du schéma à ajouter, dans l'ordre
       com: false,                COM écrit sur le schéma
       liens: { reperer, multimetre: { href, texte } },   liens ajoutés à certaines explications
       textes: { … },             remplace des textes de MONTAGE.TEXTES
       onFin(bilan),              { refus, mesures: { U_L: '6,00 V' } }
       onChange(poste)
     }
     → { refus, fini(), mesures(), recommencer(), fil(a, b), retirer(i), commande(id, nom, v),
         verifier(), toucher(cible), lire(texte), etat, circuit }
   Règles du montage (mode monter) : on part d'une borne du générateur, on réalise la boucle principale
   (sans voltmètre) dipôle après dipôle jusqu'à l'autre borne, puis les dérivations une par une ; un fil
   non conforme au schéma est refusé avec une explication ; n'importe quel fil peut être retiré.
   Le montage terminé, on allume le générateur : un appareil de mesure ou une DEL à l'envers est signalé.
   Oscilloscope : chaque voie est une dérivation (borne rouge au point de la flèche, borne noire à la masse) ;
   les deux bornes noires sont reliées dans l'appareil : elles vont au même point du circuit (ou à deux
   bornes de ce point reliées par un fil).
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const fr = (v, d) => (d == null ? String(v) : Number(v).toFixed(d)).replace('.', ',').replace('-', '−');
  const indice = n => String(n || '').replace(/_(\w+)/, '<sub>$1</sub>');
  const R_LAMPE = 75, R_MOTEUR = 20, SEUIL_DEL = 2, P_LAMPE = .48;   // lampe 6 V – 80 mA

  /* ---------- Textes (remplaçables par l'option textes) ---------- */
  const TEXTES = {
    // repérage de la boucle principale sur le schéma
    vide: 'Touche les fils et les dipôles de la boucle, puis « Vérifier ».',
    sansG: 'La boucle principale contient le générateur : c\'est lui qui fait circuler le courant.',
    voltBoucle: 'Le voltmètre n\'est jamais dans la boucle principale : il se branche en dérivation, une fois la boucle faite.',
    ouverte: ou => `Ta boucle s'arrête ${ou} : suis les fils jusqu'à revenir au générateur.`,
    deuxFois: 'Ta boucle passe deux fois par le nœud cerclé sur le schéma : une boucle ne prend qu\'une des branches.',
    morceaux: 'Garde une seule boucle : celle qui part du générateur et y revient.',
    boucleOk: 'Juste ! C\'est la boucle principale : elle part du générateur et y revient. Elle reste surlignée pendant le montage.',
    boucleDabordSchema: 'Commence par repérer la boucle principale sur le schéma : touche ses fils et ses dipôles, puis « Vérifier ».',
    // refus d'un fil (mode monter)
    depart: 'On part toujours d\'une borne du générateur : la borne + ou la borne −.',
    attacher: 'Pars du montage déjà relié au générateur : un nouveau fil part toujours d\'une borne déjà branchée.',
    suivant: (x, y) => `D'après le schéma, après ${x} vient ${y} : relie la borne libre ${de(x)} ${a(y)}.`,
    suivantOu: (x, l) => `D'après le schéma, après ${x} vient ${ou(l)} : relie la borne libre ${de(x)} à l'un d'eux.`,
    premier: (x, y) => `D'après le schéma, après ${x} vient ${y} : relie ${x} ${a(y)}.`,
    premierOu: (x, l) => `D'après le schéma, après ${x} vient ${ou(l)} : relie ${x} à l'un d'eux.`,
    fermer: x => `D'après le schéma, après ${x} on revient au générateur : relie la borne libre ${de(x)} à l'autre borne du générateur.`,
    rejoindre: x => `D'après le schéma, après ${x} la dérivation rejoint le circuit au point cerclé : relie la borne libre ${de(x)} à une borne de ce point.`,
    versDeriv: l => `D'après le schéma, une dérivation part de ce point vers ${ou(l)}.`,
    pasDeDeriv: 'D\'après le schéma, aucune dérivation ne part de ce point.',
    finirG: x => `On finit la boucle sur l'autre borne du générateur : continue-la d'abord depuis la borne libre ${de(x)}.`,
    horsBoucle: 'Ce dipôle n\'est pas dans la boucle principale surlignée sur le schéma.',
    impasse: 'Par ce dipôle, la boucle ne pourrait pas revenir au générateur sans repasser par le même point.',
    dixA: 'On commence par l\'entrée 10A, le plus grand calibre ; on passe à mA ensuite si l\'intensité est petite.',
    ampBornes: 'L\'ampèremètre se branche sur ses bornes 10A et COM.',
    voltBornes: 'Le voltmètre se branche sur ses bornes V et COM.',
    serieA: 'L\'ampèremètre se branche en série : le courant doit le traverser.',
    voltSerie: 'Le voltmètre se branche en dérivation, sur les bornes du dipôle, sans modifier le circuit : il n\'est jamais dans la boucle principale.',
    boucleDabord: 'Ferme d\'abord la boucle principale ; on ajoute les dérivations ensuite.',
    finirDeriv: x => `Termine d'abord la dérivation commencée : relie la borne libre ${de(x)} à la suite du schéma.`,
    noeud: 'Le schéma n\'a pas de nœud à cet endroit : on ne met deux fils sur une même borne que là où le schéma a un point noir.',
    court: 'Ce fil relierait directement les bornes du générateur.',
    courtDipole: x => `Ce fil relierait les deux bornes ${de(x)} : le courant ne le traverserait plus.`,
    memeAppareil: 'Ce fil relierait deux bornes du même appareil.',
    dejaRelies: 'Ces deux bornes sont déjà reliées.',
    pasRelies: 'Sur le schéma, ces deux bornes ne sont pas reliées par un fil.',
    fini: 'Le montage est terminé : il n\'y a plus de fil à poser.',
    // oscilloscope
    oscBoucle: 'L\'oscilloscope se branche en dérivation, comme un voltmètre : il n\'est jamais dans la boucle principale. Ferme d\'abord la boucle, puis branche ses voies.',
    voieRouge: k => `La borne rouge de la voie CH${k} se branche au point où arrive la flèche CH${k} sur le schéma.`,
    voieMasse: 'La borne noire est la masse de l\'oscilloscope : elle se branche au point marqué du symbole de masse sur le schéma.',
    masseCourt: 'Les deux bornes noires sont reliées entre elles dans l\'oscilloscope : branchées à deux points différents du circuit, elles feraient un court-circuit.',
    voieInutile: k => `Le schéma n'utilise pas la voie CH${k} de l'oscilloscope.`,
    // vérification, générateur allumé
    delEnvers: 'La DEL ne s\'éclaire pas : elle est branchée à l\'envers. Elle ne laisse passer le courant que dans un sens : sa borne + doit être du côté de la borne + du générateur. Retire ses deux fils et rebranche-la dans l\'autre sens.',
    ampEnvers: x => `${cap(x)} est branché à l'envers : le courant doit entrer par la borne 10A et sortir par la borne COM, reliée du côté de la borne − du générateur. Il indiquerait une valeur négative. Retire ses deux fils et inverse-les.`,
    voltEnvers: x => `${cap(x)} est branché à l'envers : sa borne COM doit être reliée du côté de la borne − du générateur. Il indiquerait une valeur négative. Retire ses deux fils et inverse-les.`,
    // consignes (mode monter)
    cBoucle: 'Surligne la <b>boucle principale</b> : touche ses fils et ses dipôles sur le schéma, puis « Vérifier ».',
    cDepart: 'Tire le premier fil depuis une <b>borne du générateur</b> (+ ou −) vers le premier dipôle de la boucle principale.',
    cSuite: x => `Continue la boucle principale : relie la borne libre ${de(x)} au dipôle suivant du schéma.`,
    cFermer: x => `Ferme la boucle : relie la borne libre ${de(x)} à l'autre borne du générateur.`,
    cDeriv: 'Ajoute une <b>dérivation</b> : pars d\'une borne du montage reliée à un nœud du schéma (point noir).',
    cDerivSuite: x => `Continue la dérivation : relie la borne libre ${de(x)} à la suite du schéma.`,
    cRejoindre: x => `Termine la dérivation : relie la borne libre ${de(x)} au point du circuit où elle arrive sur le schéma.`,
    cReprendre: 'Rebranche les fils qui manquent, en suivant le schéma.',
    cVerifier: k => `Le montage est terminé. Vérifie-le : ${k ? 'ferme l\'interrupteur (touche son levier), puis ' : ''}allume le générateur (touche son bouton <b>Marche</b>).`,
    cInterrupteur: 'Ferme l\'interrupteur : touche son levier.',
    cOscillo: 'Branche l\'oscilloscope : pour chaque voie, la borne <b>rouge</b> au point où arrive sa flèche sur le schéma et la borne <b>noire</b> (masse) au point marqué du symbole de masse.',
    cVoieRouge: k => `Termine la voie CH${k} : relie sa borne <b>rouge</b> au point où arrive la flèche CH${k} sur le schéma.`,
    cVoieMasse: k => `Termine la voie CH${k} : relie sa borne <b>noire</b> (masse) au point marqué du symbole de masse sur le schéma.`,
    fin: 'Le montage est conforme au schéma et il fonctionne.',
    // mode mesurer
    debrancher: (x, y) => `Débranche le fil qui relie ${x} ${a(y)} : l'ampèremètre va prendre sa place (voir le schéma). Touche ce fil, puis « Retirer ce fil ».`,
    pasCeFil: 'Ce n\'est pas ce fil.',
    pasToucher: 'Ce fil reste en place : seul le fil remplacé par l\'ampèremètre se débranche.',
    voltSansDebrancher: 'Le voltmètre se branche en dérivation : on ne débranche aucun fil du circuit.',
    dejaBien: 'L\'appareil est bien branché : pas besoin de le débrancher.',
    debrancherDabord: 'Débranche d\'abord le fil dont l\'ampèremètre va prendre la place.',
    reglerMaintenant: 'L\'appareil est branché : règle-le maintenant (touche son sélecteur).',
    memeMultimetre: 'Utilise le même multimètre pour ses deux fils.',
    unFil: 'Cette borne de l\'appareil est déjà branchée.',
    cBrancherA: (x, y) => `Branche l'ampèremètre <b>en série</b>, à la place du fil retiré : relie sa borne <b>10A</b> ${a(x)} et sa borne <b>COM</b> ${a(y)}. Le courant entre par 10A et sort par COM, du côté de la borne − du générateur.`,
    cBrancherV: x => `Branche le voltmètre <b>en dérivation</b> aux bornes ${de(x)}, sans débrancher aucun fil : borne <b>V</b> du côté de la borne + du générateur, borne <b>COM</b> du côté de la borne −.`,
    lieuA: (x, y) => `L'ampèremètre se branche en série, à la place du fil retiré : relie-le ${a(x)} et ${a(y)}.`,
    lieuV: x => `Le voltmètre se branche aux bornes ${de(x)} : relie ses bornes V et COM aux deux bornes ${de(x)}, ou à des bornes reliées à elles par un fil.`,
    cCal10: 'Règle l\'ampèremètre : touche son sélecteur, choisis la fonction <b>A⎓</b> et le plus grand calibre, <b>10 A</b>.',
    cVersmA: t => `L'écran affiche <b>${t}</b> : ${t.replace('.', ',')} A, lecture peu précise. Passe la fiche de l'entrée <b>10A</b> à l'entrée <b>mA</b> : fais-la glisser d'une borne à l'autre.`,
    cCalmA: 'Choisis le calibre en mA le plus adapté : le <b>plus petit calibre qui reste plus grand que l\'intensité</b> mesurée.',
    cCalmax: 'Règle le voltmètre : touche son sélecteur, choisis la fonction <b>V⎓</b> et le plus grand calibre, <b>600 V</b>.',
    cCalV: t => `L'écran affiche <b>${t}</b> : lecture peu précise. Choisis le <b>plus petit calibre qui reste plus grand que la tension</b> mesurée.`,
    cLire: n => `Lis l'écran et écris ${n} avec son unité.`,
    fonctionA: 'Choisis la fonction <b>A⎓</b> : intensité, courant continu.',
    fonctionV: 'Choisis la fonction <b>V⎓</b> : tension continue.',
    commencer10: 'On commence toujours par le plus grand calibre : <b>10 A</b>.',
    commencer600: 'On commence toujours par le plus grand calibre : <b>600 V</b>.',
    depasse: 'L\'écran affiche « 1 » à gauche : la valeur dépasse le calibre. Choisis un calibre plus grand.',
    plusPetit: 'Un calibre plus petit donnerait une lecture plus précise, sans dépasser : essaie-le.',
    entreeMA: 'La fiche est sur l\'entrée mA : choisis un calibre en mA.',
    lireFormat: 'Écris un nombre suivi de son unité, par exemple 16,3 mA ou 6,37 V.',
    lireUniteA: 'Une intensité s\'exprime en ampères (A ou mA).',
    lireUniteV: 'Une tension s\'exprime en volts (V ou mV).',
    lireMilli: 'Attention à l\'unité : l\'écran affiche la valeur dans l\'unité du calibre (mA pour un calibre en mA, mV pour un calibre en mV).',
    lireFaux: 'Relis l\'écran du multimètre : écris le nombre affiché, avec l\'unité du calibre.',
    // mode mesurer : oscilloscope
    cBrancherVoie: (k, u) => `Branche la voie <b>CH${k}</b>${u ? `, qui mesure la tension <b>${u}</b> (flèche sur le schéma),` : ''} en dérivation, sans débrancher aucun fil : borne <b>rouge</b> au point où arrive la flèche CH${k} sur le schéma, borne <b>noire</b> (masse) au point marqué du symbole de masse.`,
    lieuVoie: k => `Relie la borne rouge de la voie CH${k} au point de la flèche CH${k} et sa borne noire au point de la masse : à une borne de ce point, ou à une borne reliée à elle par un fil.`,
    autreVoie: k => `Sur le schéma, c'est la voie CH${k} : utilise la fiche CH${k} de l'oscilloscope.`,
    ficheFiche: 'Relie la fiche de l\'oscilloscope à un point du circuit.',
    oscSansDebrancher: 'L\'oscilloscope se branche en dérivation : on ne débranche aucun fil du circuit.',
    finOsc: 'L\'oscilloscope est branché : chaque voie affiche la tension entre son point et la masse.',
  };
  const ou = l => l.join(', ').replace(/, ([^,]*)$/, ' ou $1');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const de = n => n.replace(/^le /, 'du ').replace(/^la /, 'de la ').replace(/^l'/, 'de l\'');
  const a = n => n.replace(/^le /, 'au ').replace(/^la /, 'à la ').replace(/^l'/, 'à l\'');
  const NOMS = { generateur: 'le générateur', resistance: d => `la résistance de ${d.valeur} Ω`, lampe: 'la lampe', interrupteur: 'l\'interrupteur',
                 del: 'la DEL', moteur: 'le moteur', amperemetre: d => d.mesure ? `l'ampèremètre de ${indice(d.mesure)}` : 'l\'ampèremètre',
                 voltmetre: d => d.mesure ? `le voltmètre de ${indice(d.mesure)}` : 'le voltmètre',
                 voie: d => `la voie CH${d.voie} de l'oscilloscope` };
  const nomDe = d => d.nom || (typeof NOMS[d.type] === 'function' ? NOMS[d.type](d) : NOMS[d.type]);
  // objet de la table pour un dipôle du schéma : multimètre, fiche de l'oscilloscope (voie 1 ou 2), plaquette
  const genre = t => (t === 'amperemetre' || t === 'voltmetre') ? 'multimetre' : t === 'voie' ? 'fiche' : t;
  const sorte = d => genre(d.type) + (d.type === 'resistance' ? ':' + d.valeur : d.type === 'voie' ? d.voie : '');
  // appareils de mesure (jamais dans la boucle principale pour ceux qui se branchent en dérivation)
  const enDerivation = t => t === 'voltmetre' || t === 'voie';
  const appareil = t => t === 'amperemetre' || enDerivation(t);

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
    // o.marche : générateur allumé (l'écran affiche la tension) ; o.commande : bouton Marche à toucher ;
    // o.reglable : bouton de tension à toucher (sinon la tension est déjà réglée)
    generateur(o) {
      const w = 180, h = 124, t = o.tension || 0, ang = angTension(t), on = !!o.marche;
      const txt = !on ? '' : Math.abs(t) >= 10 ? t.toFixed(1) : t.toFixed(2);
      const zones = {};
      if (o.reglable) zones.bouton = { x: 143, y: 46, r: 26 };
      if (o.commande) zones.marche = { x: 154, y: 100, r: 21 };
      return { w, h, svg: `
        <rect class="mt-boitier" x="0" y="0" width="${w}" height="${h}" rx="12"/>
        <rect class="mt-chant" x="2" y="${h - 7}" width="${w - 4}" height="5" rx="2.5"/>
        <text class="mt-marque" x="14" y="17">ALIMENTATION</text>
        <text class="mt-marque" x="${w - 14}" y="17" text-anchor="end">0 – 12 V ⎓</text>
        <rect class="mt-ecran-gen" x="14" y="25" width="90" height="40" rx="6"/>
        ${afficheur(24, 32, 25, txt, 3, true)}
        ${on ? '<text class="mt-ecran-unite" x="96" y="58" text-anchor="end">V</text>' : ''}
        <circle class="mt-bouton-jupe" cx="143" cy="46" r="22"/><circle class="mt-bouton" cx="143" cy="46" r="17"/>
        <line class="mt-bouton-trait" x1="143" y1="46" x2="${pol(143, 46, 13, ang)[0].toFixed(1)}" y2="${pol(143, 46, 13, ang)[1].toFixed(1)}"/>
        <text class="mt-marque" x="143" y="80" text-anchor="middle">TENSION</text>
        <text class="mt-signe mt-signe-plus" x="20" y="105" text-anchor="middle">+</text>
        <text class="mt-signe" x="116" y="105" text-anchor="middle">−</text>
        <rect class="mt-bascule" x="136" y="90" width="36" height="20" rx="5"/>
        <rect class="mt-bascule-appui${on ? ' on' : ''}" x="${on ? 136 : 154}" y="90" width="18" height="20" rx="5"/>
        <text class="mt-bascule-t${on ? ' on' : ''}" x="145" y="104" text-anchor="middle">I</text>
        <text class="mt-bascule-t" x="163" y="104" text-anchor="middle">O</text>
        <text class="mt-marque" x="154" y="119" text-anchor="middle">MARCHE</text>`,
        bornes: { plus: { x: 42, y: 100, genre: 'plus' }, moins: { x: 94, y: 100, genre: 'moins' } },
        zones };
    },
    // o.reglable === false : sélecteur inactif (pas de mesure à prendre)
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
        zones: o.reglable === false ? {} : { selecteur: { x: 85, y: 142, r: 42 } } };
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
    // oscilloscope à deux voies (sans bornes : ses entrées sont les deux fiches, objets « fiche » posés dessus) ;
    // o.u : tensions des voies CH1 et CH2 (V), o.sens : sensibilités (V/div) ; boutons sans réglage
    oscilloscope(o) {
      const w = 300, h = 232, u = o.u || [0, 0], sens = o.sens || [2, 2];
      // écran : 10 × 8 divisions ; zéro de CH1 une division sous le centre, zéro de CH2 trois divisions sous le centre
      const ex = 16, ey = 28, ew = 168, eh = 112, dx = ew / 10, dy = eh / 8, y0 = ey + eh / 2, zero = [1, 3];
      let s = `<rect class="mt-boitier" x="0" y="0" width="${w}" height="${h}" rx="12"/>
        <rect class="mt-chant" x="2" y="${h - 7}" width="${w - 4}" height="5" rx="2.5"/>
        <text class="mt-marque" x="14" y="17">OSCILLOSCOPE</text>
        <text class="mt-marque" x="${w - 14}" y="17" text-anchor="end">2 VOIES</text>
        <rect class="mt-osc-ecran" x="12" y="24" width="176" height="140" rx="6"/>`;
      for (let i = 1; i < 10; i++) s += `<line class="mt-osc-grille${i === 5 ? ' axe' : ''}" x1="${(ex + i * dx).toFixed(1)}" y1="${ey}" x2="${(ex + i * dx).toFixed(1)}" y2="${ey + eh}"/>`;
      for (let j = 1; j < 8; j++) s += `<line class="mt-osc-grille${j === 4 ? ' axe' : ''}" x1="${ex}" y1="${ey + j * dy}" x2="${ex + ew}" y2="${ey + j * dy}"/>`;
      s += `<rect class="mt-osc-cadre" x="${ex}" y="${ey}" width="${ew}" height="${eh}"/>`;
      // traces (tension continue : droite horizontale) ; zéro de chaque voie repéré à gauche de l'écran
      [0, 1].forEach(k => {
        const yz = y0 + zero[k] * dy, yt = Math.max(ey + 1, Math.min(ey + eh - 1, yz - (u[k] || 0) / sens[k] * dy));
        s += `<line class="mt-osc-t${k + 1}" x1="${ex}" y1="${yt.toFixed(1)}" x2="${ex + ew}" y2="${yt.toFixed(1)}"/>`;
        s += `<path class="mt-osc-c${k + 1}" d="M${ex} ${yz - 5} h7 l5 5 l-5 5 h-7 z"/><text class="mt-osc-zero" x="${ex + 4.5}" y="${yz + 2.4}" text-anchor="middle">${k + 1}</text>`;
        s += `<text class="mt-osc-info v${k + 1}" x="${ex + 2 + k * 50}" y="155">CH${k + 1} ${fr(sens[k])} V/div</text>`;
      });
      s += `<text class="mt-osc-info base" x="${ex + ew - 2}" y="155" text-anchor="end">1 ms/div</text>`;
      // pastille de couleur d'une voie
      const pastille = (cx, cy, k) => `<rect class="mt-osc-c${k}" x="${cx - 15}" y="${cy - 6.5}" width="30" height="13" rx="6.5"/>
        <text class="mt-osc-pastille-t v${k}" x="${cx}" y="${cy + 3}" text-anchor="middle">CH${k}</text>`;
      // commandes (décor) : sensibilités des deux voies, base de temps
      const bouton = (cx, cy, r, cls) => `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${r + 4}"/><circle class="mt-bouton" cx="${cx}" cy="${cy}" r="${r}"/>
        <line class="mt-bouton-trait" x1="${cx}" y1="${cy}" x2="${(cx + r * .55).toFixed(1)}" y2="${(cy - r * .55).toFixed(1)}"/>`;
      s += `${pastille(220, 32, 1)}${pastille(268, 32, 2)}
        ${bouton(220, 60, 12, 'mt-osc-jupe1')}${bouton(268, 60, 12, 'mt-osc-jupe2')}
        <text class="mt-marque" x="244" y="92" text-anchor="middle">VOLTS/DIV</text>
        ${bouton(244, 116, 10, 'mt-bouton-jupe')}
        <text class="mt-marque" x="244" y="146" text-anchor="middle">TEMPS/DIV</text>`;
      // pastilles au-dessus des entrées (les fiches sont posées en ENTREES_OSC)
      ENTREES_OSC.forEach((p, i) => { s += pastille(p.x + 35, p.y - 10, i + 1); });
      return { w, h, svg: s, bornes: {}, zones: {} };
    },
    // fiche enfichée sur la prise coaxiale d'une voie : borne rouge (la voie), borne noire (la masse)
    fiche() {
      return { w: 70, h: 34, svg: '<rect class="mt-osc-fiche" x="0" y="0" width="70" height="34" rx="9"/>',
        bornes: { 1: { x: 13, y: 17, genre: 'plus' }, 2: { x: 57, y: 17, genre: 'moins' } }, zones: {} };
    },
  };
  // position des fiches des voies CH1 et CH2 sur l'oscilloscope (coin haut gauche, repère de l'oscilloscope)
  const ENTREES_OSC = [{ x: 57, y: 185 }, { x: 187, y: 185 }];
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

  /* ---------- Disposition « en rangée » : générateur et appareils au fond, plaquettes devant ---------- */
  const auFond = t => ['generateur', 'multimetre', 'oscilloscope'].includes(t);
  function disposer(tout, W) {
    // les fiches de l'oscilloscope sont placées sur ses entrées, après le reste
    const fiches = tout.filter(m => m.type === 'fiche'), materiel = tout.filter(m => m.type !== 'fiche');
    const gap = 10;
    let y = 8, rangee = [], larg = 0;
    const rangees = [];
    const fin = () => { if (rangee.length) rangees.push(rangee); rangee = []; larg = 0; };
    materiel.forEach((m, i) => {
      const d = descMat(m);
      const plaque = !auFond(m.type);
      if (plaque && i > 0 && !['interrupteur', 'resistance', 'lampe', 'del', 'moteur'].includes(materiel[i - 1].type)) fin();
      if (rangee.length && larg + gap + d.w > W) fin();
      larg += (rangee.length ? gap : 0) + d.w;
      rangee.push({ m, d });
    });
    fin();
    rangees.forEach(r => {
      const h = Math.max(...r.map(o => o.d.h)), somme = r.reduce((s, o) => s + o.d.w, 0);
      const plaques = r.every(o => !auFond(o.m.type));
      const g = plaques && r.length > 1 ? (W - somme) / (r.length - 1) : gap;
      let x = plaques && r.length === 1 ? (W - somme) / 2 : 0;
      r.forEach(o => { o.m.x = Math.round(x); o.m.y = Math.round(y + (plaques ? (h - o.d.h) / 2 : 0)); x += o.d.w + Math.min(g, 60); });
      y += h + 16;
    });
    const O = materiel.find(m => m.type === 'oscilloscope');
    fiches.forEach(m => { const p = ENTREES_OSC[m.voie - 1]; m.x = O.x + p.x; m.y = O.y + p.y; });
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
        obst: scene.materiel.map(m => { const d = descMat(m); return { x: m.x, y: m.y, w: d.w, h: d.h, poids: { multimetre: 6, generateur: 5, oscilloscope: 5 }[m.type] || 1.5 }; }) };
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
      // redessin à l'image suivante : la borne touchée reste dans la page pour l'événement touchstart qui suit
      requestAnimationFrame(dessiner);
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
    // au doigt, un fil tiré depuis une borne ne fait pas défiler la page (touch-action n'agit pas sur les formes SVG)
    svg.addEventListener('touchstart', ev => { if (opt.actif && ev.target.dataset && ev.target.dataset.borne) ev.preventDefault(); }, { passive: false });
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
        if (nom === 'levier' || nom === 'marche') { if (opt.onCommande) opt.onCommande(id, nom); }
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
  // voie de l'oscilloscope : flèche vers l'extérieur depuis le point (x, y), nom de la voie
  const DIR = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
  function flecheVoie(d) {
    const L = 30, [ux, uy] = DIR[d.dir] || DIR.haut, x = d.x, y = d.y, x2 = x + ux * L, y2 = y + uy * L, px = -uy, py = ux;
    const [lx, ly, an] = !ux ? [x2 + 6, y2 - uy * 4, 'start'] : [x2, y2 - 10, ux < 0 ? 'start' : 'end'];
    const f = v => v.toFixed(1);
    return `<path class="ms-trait" d="M${x} ${y} L${f(x2 - ux * 6)} ${f(y2 - uy * 6)}"/>
      <path class="ms-pointe" d="M${x2} ${y2} L${f(x2 - ux * 9 + px * 4.5)} ${f(y2 - uy * 9 + py * 4.5)} L${f(x2 - ux * 9 - px * 4.5)} ${f(y2 - uy * 9 - py * 4.5)} Z"/>
      <text class="ms-voie" x="${lx}" y="${ly}" dy=".35em" text-anchor="${an}">CH${d.voie}</text>`;
  }
  // symbole de masse (dessiné une seule fois : la masse est commune aux deux voies)
  const symboleMasse = (x, y) => `<path class="ms-trait" d="M${x} ${y} V${y + 16} M${x - 12} ${y + 16} H${x + 12}${[-9, -3, 3, 9].map(p => ` M${x + p + 3} ${y + 16} l-6 7`).join('')}"/>`;

  // position d'une borne de symbole ('a' à gauche, 'b' à droite avant rotation) ; voie : son point et la masse
  function borneSchema(d, t) {
    if (d.type === 'voie') return t === 'a' ? [d.x, d.y] : d.masse.slice();
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
        if (!dans(opt.boucle, d.id) || d.type === 'voie') return;
        const [, L] = symbole(d);
        fond += `<g transform="translate(${d.x} ${d.y}) rotate(${d.rot || 0})"><path class="ms-boucle" d="M${-L - 2} 0 H${L + 2}"/></g>`;
      });
      const etat = id => dans(opt.choisis, id) ? ' choisi' : dans(opt.derivs, id) ? ' deriv' : dans(opt.branches, id) ? ' branche' : '';
      c.fils.forEach(f => {
        haut += `<polyline class="ms-fil${etat(f.id)}" points="${pts(f.pts)}"/>`;
        if (opt.libre) cibles += `<polyline class="ms-cible" data-type="fil" data-id="${f.id}" points="${pts(f.pts)}"/>`;
      });
      // oscilloscope : une flèche par voie, un seul symbole de masse (surligné dès qu'une voie est branchée)
      const voies = c.dipoles.filter(d => d.type === 'voie');
      if (voies.length && c.masse) haut += `<g class="ms-dipole${voies.map(d => etat(d.id)).find(e => e) || ''}">${symboleMasse(c.masse.x, c.masse.y)}</g>`;
      voies.forEach(d => {
        haut += `<g class="ms-dipole${etat(d.id)}">${flecheVoie(d)}</g>`;
        const [ux, uy] = DIR[d.dir] || DIR.haut;
        if (opt.cerne === d.id) haut += `<circle class="ms-cerne" cx="${d.x + ux * 17}" cy="${d.y + uy * 17}" r="20"/>`;
      });
      c.dipoles.forEach(d => {
        if (d.type === 'voie') return;
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
    const v = c.dipoles.find(d => S.has(d.id) && enDerivation(d.type));
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
    const ar = gr.aretes.filter(e => e.id !== G.id && !enDerivation(gr.dip(e.id).type));
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
    // oscilloscope : les bornes noires (masses) des deux fiches sont reliées dans l'appareil
    const fiches = scene.materiel.filter(m => m.type === 'fiche');
    fiches.slice(1).forEach(m => { par[f(m.id + '.2')] = f(fiches[0].id + '.2'); });
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
      if (m.type === 'generateur') sources.push({ id: m.id, p: 'G.plus', q: 'G.moins', e: m.marche ? m.tension || 0 : 0 });
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
      // oscilloscope : tension de chaque voie (borne rouge − masse)
      if (m.type === 'oscilloscope') m.u = [1, 2].map(k => { const fi = fiches.find(x => x.voie === k); return fi ? res.V[fi.id + '.1'] - res.V[fi.id + '.2'] : 0; });
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
     POSTE DE MONTAGE : schéma + table + consigne + déroulé
     L'état du montage se déduit des fils posés et de l'affectation du
     matériel de la table aux dipôles du schéma : n'importe quel fil peut
     être retiré, le montage reprend là où il en est.
     ============================================================ */
  // ensembles disjoints sur des chaînes (bornes de la table)
  function unions() {
    const p = {};
    const f = x => { if (p[x] == null) p[x] = x; while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
    return { f, u: (x, y) => { p[f(x)] = f(y); } };
  }
  const autreT = t => (t === 'a' ? 'b' : 'a');
  const comS = d => (d.com === -1 ? 'a' : 'b');      // borne du schéma côté COM (com : 1 → b, −1 → a)
  // b : borne de la table ; t : borne du schéma à laquelle elle serait reliée (voie : 'a' = flèche, 'b' = masse)
  const borneValide = (d, b, t) => (d.type === 'amperemetre' ? ['10A', 'COM'].includes(b) : d.type === 'voltmetre' ? ['V', 'COM'].includes(b)
    : d.type === 'voie' ? (b === '1') === (t === 'a') : true);

  // lecture d'une saisie « 16,3 mA » → { v (unités SI), famille 'A' | 'V' } ou null
  function lireValeur(t) {
    const m = String(t).trim().replace(/\s+/g, ' ').replace('−', '-').match(/^(-?\d+(?:[.,]\d+)?)\s*(ma|a|mv|v)$/i);
    if (!m) return null;
    const v = parseFloat(m[1].replace(',', '.')), u = m[2].toLowerCase();
    return { v: u.startsWith('m') ? v / 1000 : v, famille: u.endsWith('a') ? 'A' : 'V' };
  }

  function monter(zone, c, opts) {
    opts = Object.assign({ mode: 'monter', boucle: false, com: false, mesurer: [], rendu: 'relief', liens: null }, opts || {});
    const T = Object.assign({}, TEXTES, opts.textes || {});
    const mesure = opts.mode === 'mesurer';
    const gr = graphe(c), G = gr.G;
    const sch = id => gr.dip(id);
    const plusS = G.id + '.' + plusDe(G), moinsS = G.id + '.' + autreT(plusDe(G));
    // nom d'un dipôle du schéma ; « l'ampèremètre » tout court s'il est le seul de son type
    const nomS = id => { const d = sch(id); return ['amperemetre', 'voltmetre'].includes(d.type) && c.dipoles.filter(x => x.type === d.type).length === 1 ? NOMS[d.type]({}) : nomDe(d); };
    // lien vers un autre module, ajouté à une explication
    const lien = k => (opts.liens && opts.liens[k] ? ` <a class="mt-lien" href="${opts.liens[k].href}">${opts.liens[k].texte}</a>` : '');
    zone.classList.add('mt-poste-z');
    zone.innerHTML = `<div class="mt-poste">
        <div class="mt-poste-schema"><div class="mt-schema-z"></div><div class="mt-consigne" aria-live="polite"></div></div>
        <div class="mt-poste-table"><div class="mt-table-z"></div></div>
      </div><ol class="mt-deroule"></ol>`;
    const zSch = zone.querySelector('.mt-schema-z'), zCons = zone.querySelector('.mt-consigne'), zTab = zone.querySelector('.mt-table-z');
    zone.querySelector('.mt-poste-schema').style.setProperty('--ratio', (c.vb[c.vb.length - 2] / c.vb[c.vb.length - 1]).toFixed(3));

    // ---------- matériel de la table : un objet par dipôle du schéma ----------
    function materielInitial() {
      const l = [{ id: 'G', type: 'generateur', tension: c.tension || 0, marche: mesure, commande: !mesure, sorte: 'generateur' }];
      let k = 0;
      c.dipoles.filter(d => genre(d.type) === 'multimetre').forEach(() => l.push({ id: 'M' + (++k), type: 'multimetre', position: 'OFF', sorte: 'multimetre', reglable: mesure }));
      // oscilloscope et ses deux fiches (CH1, CH2), même si le schéma n'utilise qu'une voie
      if (c.dipoles.some(d => d.type === 'voie')) {
        l.push({ id: 'O', type: 'oscilloscope', sens: c.sens || [2, 2], sorte: 'oscilloscope' });
        [1, 2].forEach(v => l.push({ id: 'O' + v, type: 'fiche', voie: v, sorte: 'fiche' + v }));
      }
      let plaq = c.dipoles.filter(d => !['generateur', 'amperemetre', 'voltmetre', 'voie'].includes(d.type));
      plaq = c.table ? c.table.map(id => sch(id)) : ordreSchema(plaq);
      plaq.forEach((d, i) => l.push({ id: 'P' + (i + 1), type: d.type, valeur: d.valeur, ferme: mesure, sorte: sorte(d) }));
      return l;
    }

    // plaquettes dans l'ordre du schéma, pour que les fils se croisent peu : en suivant le circuit depuis la
    // borne + du générateur (rang : nombre de dipôles traversés ; un ampèremètre compte pour 0 ; ni voltmètre
    // ni oscilloscope), puis dans l'ordre de la description du schéma
    function ordreSchema(plaq) {
      const dist = { [gr.plus]: 0 };
      for (let change = true; change;) {
        change = false;
        gr.aretes.forEach(e => {
          if (e.id === G.id || enDerivation(sch(e.id).type)) return;
          const w = sch(e.id).type === 'amperemetre' ? 0 : 1;
          [[e.u, e.v], [e.v, e.u]].forEach(([x, y]) => {
            if (dist[x] != null && (dist[y] == null || dist[x] + w < dist[y])) { dist[y] = dist[x] + w; change = true; }
          });
        });
      }
      const rang = d => Math.min(...['a', 'b'].map(t => { const v = dist[gr.sommet(d.id + '.' + t)]; return v == null ? 99 : v; }));
      return plaq.map((d, i) => [rang(d), i, d]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[2]);
    }

    let st, vSch, vTab, L = [];
    const mat = id => st.scene.materiel.find(m => m.id === id);
    const nbFils = ref => st.scene.fils.filter(f => f[0] === ref || f[1] === ref).length;
    const dipsAff = () => new Set(Object.values(st.aff).map(f => f.dip));
    const itemDe = dip => Object.keys(st.aff).find(k => st.aff[k].dip === dip);
    const gen = () => mat('G');

    // ---------- correspondance table ↔ schéma ----------
    // bornes utilisées d'un objet affecté (multimètre : COM et l'entrée de sa fonction)
    function bornesItem(id) {
      const m = mat(id), f = st.aff[id];
      if (m.type !== 'multimetre') return [id + '.1', id + '.2'];
      const amp = sch(f.dip).type === 'amperemetre';
      return [id + '.COM', id + '.' + (amp ? (nbFils(id + '.mA') ? 'mA' : '10A') : 'V')];
    }
    // borne du schéma (« L1.a ») qui correspond à une borne de la table, ou null
    function borneS(ref) {
      const [id, b] = ref.split('.');
      if (id === 'G') return b === 'plus' ? plusS : moinsS;
      const f = st.aff[id];
      if (!f) return null;
      if (mat(id).type !== 'multimetre') return f.dip + '.' + (b === '1' ? f.t1 : autreT(f.t1));
      if (b === 'COM') return f.dip + '.' + f.com;
      const amp = sch(f.dip).type === 'amperemetre';
      return (amp ? b === '10A' || b === 'mA' : b === 'V') ? f.dip + '.' + autreT(f.com) : null;
    }
    const sommetDe = ref => { const s = borneS(ref); return s ? gr.sommet(s) : null; };
    // borne de la table qui correspond à une borne du schéma (dipôle déjà sur la table)
    function refDe(t) {
      if (t === plusS) return 'G.plus';
      if (t === moinsS) return 'G.moins';
      const [id, b] = t.split('.'), it = itemDe(id);
      if (!it) return null;
      const f = st.aff[it];
      if (mat(it).type !== 'multimetre') return it + '.' + (b === f.t1 ? '1' : '2');
      return b === f.com ? it + '.COM' : bornesItem(it)[1];
    }
    // nom d'une borne de la table pour l'élève : « la borne + du générateur », « la lampe L₁ »
    const nomBorne = ref => {
      if (ref === 'G.plus') return 'la borne + du générateur';
      if (ref === 'G.moins') return 'la borne − du générateur';
      const id = ref.split('.')[0], m = mat(id);
      if (st.aff[id]) return nomS(st.aff[id].dip);
      return nomDe({ type: m.type === 'multimetre' ? 'voltmetre' : m.type === 'fiche' ? 'voie' : m.type, valeur: m.valeur, voie: m.voie });
    };
    const noeudDe = s => { const n = (c.noeuds || []).find(x => gr.sommet(x.id) === s); return n ? n.id : null; };

    // ---------- analyse de l'état : composantes, boucle fermée, bornes libres ----------
    function analyse() {
      const fils = st.scene.fils.filter(f => !f.pont);       // le « pont » (mode mesurer) n'est pas dans le schéma
      const W = unions(), S = unions(), B = unions();
      fils.forEach(([p, q]) => { W.u(p, q); S.u(p, q); B.u(p, q); });
      Object.keys(st.aff).forEach(id => { const [x, y] = bornesItem(id); S.u(x, y); if (!enDerivation(sch(st.aff[id].dip).type)) B.u(x, y); });
      const ferme = B.f('G.plus') === B.f('G.moins');
      const dansG = t => S.f(t) === S.f('G.plus') || S.f(t) === S.f('G.moins');
      const gp = nbFils('G.plus') > 0, gm = nbFils('G.moins') > 0;
      // borne du générateur qui sert à fermer la boucle (l'autre est celle du départ) ;
      // après un fil retiré (réparation), on peut repartir des deux bornes
      const fermeture = !ferme && gp !== gm && !st.retraits ? (gp ? 'G.moins' : 'G.plus') : null;
      // bornes libres : extrémité d'un dipôle relié par son autre borne (ou borne libre du générateur)
      const libres = [], atteints = new Set();
      Object.keys(st.aff).forEach(id => {
        const [x, y] = bornesItem(id);
        if (!dansG(x)) return;
        atteints.add(sommetDe(x)); atteints.add(sommetDe(y));
        if (!nbFils(x) && nbFils(y)) libres.push(x); else if (!nbFils(y) && nbFils(x)) libres.push(y);
      });
      if (gp) atteints.add(gr.plus);
      if (gm) atteints.add(gr.moins);
      if (!ferme) ['G.plus', 'G.moins'].forEach(t => { if (!nbFils(t) && t !== fermeture) libres.push(t); });
      return { W, S, ferme, dansG, fermeture, libres, atteints };
    }
    // point où la boucle doit revenir (borne du générateur qui n'est pas celle du départ)
    function pointFermeture(x, A) {
      if (A.fermeture) return sommetDe(A.fermeture);
      return x === 'G.plus' ? gr.moins : x === 'G.moins' ? gr.plus : null;
    }
    // la boucle peut-elle revenir au point f depuis s, par des dipôles pas encore placés (sans voltmètre),
    // sans repasser par un point déjà atteint ni par le point de départ d ?
    function revient(s, f, A, exclu, d) {
      if (f == null || s === f) return true;
      const used = dipsAff(), vus = new Set([s, d]), file = [s];
      while (file.length) {
        const x = file.shift();
        for (const e of gr.aretes) {
          if (e.id === G.id || e.id === exclu || used.has(e.id) || enDerivation(sch(e.id).type) || (st.imposee && !st.imposee.has(e.id))) continue;
          const y = e.u === x ? e.v : e.v === x ? e.u : null;
          if (y == null || vus.has(y)) continue;
          if (y === f) return true;
          if (A.atteints.has(y)) continue;
          vus.add(y); file.push(y);
        }
      }
      return false;
    }
    // la dérivation peut-elle rejoindre le circuit depuis s, par des dipôles pas encore placés ?
    function rejoint(s, A, exclu) {
      if (A.atteints.has(s)) return true;
      const used = dipsAff(), vus = new Set([s]), file = [s];
      while (file.length) {
        const x = file.shift();
        for (const e of gr.aretes) {
          if (e.id === G.id || e.id === exclu || used.has(e.id)) continue;
          const y = e.u === x ? e.v : e.v === x ? e.u : null;
          if (y == null || vus.has(y)) continue;
          if (A.atteints.has(y)) return true;
          vus.add(y); file.push(y);
        }
      }
      return false;
    }
    // dipôles du schéma qui peuvent suivre la borne x : nouveaux, ou déjà sur la table mais pas encore reliés à x
    function suivants(x, A) {
      const sx = sommetDe(x), dx = x.startsWith('G.') ? G.id : st.aff[x.split('.')[0]].dip, used = dipsAff();
      const fv = A.ferme ? null : pointFermeture(x, A);
      return c.dipoles.filter(d => {
        if (d.id === G.id || d.id === dx) return false;
        const ta = gr.sommet(d.id + '.a') === sx, tb = gr.sommet(d.id + '.b') === sx;
        if (!ta && !tb) return false;
        if (used.has(d.id)) { const r = refDe(d.id + '.' + (ta ? 'a' : 'b')); return !!r && A.W.f(r) !== A.W.f(x); }
        const s2 = gr.sommet(d.id + '.' + (ta ? 'b' : 'a'));
        if (!A.ferme) {
          if (enDerivation(d.type) || (st.imposee && !st.imposee.has(d.id))) return false;
          if (st.retraits) return true;                   // réparation : les morceaux restants se rejoignent
          if (fv != null && s2 !== fv && (A.atteints.has(s2) || s2 === sx)) return false;
          return revient(s2, fv, A, d.id, sx);
        }
        return rejoint(s2, A, d.id);
      });
    }
    // le point de x est-il déjà atteint par une autre borne du montage ?
    const pointAtteint = (x, A) => { const s = sommetDe(x); return ['G.plus', 'G.moins'].concat(...Object.keys(st.aff).map(bornesItem)).some(t => t !== x && A.dansG(t) && (nbFils(t) || !t.startsWith('G.')) && sommetDe(t) === s); };

    // ---------- évaluation d'un fil (mode monter) ----------
    // explication : ce qui doit suivre la borne x d'après le schéma
    function conseil(x, A, borne) {
      const sx = sommetDe(x), nx = nomBorne(x), estG = x.startsWith('G.');
      if (!A.ferme) {
        const fv = pointFermeture(x, A);
        if (fv != null && sx === fv && !estG) return { msg: T.fermer(nx), borne, cerne: G.id };
      } else if (A.libres.includes(x) && pointAtteint(x, A)) return { msg: T.rejoindre(nx), borne, cerne: noeudDe(sx) };
      const l = suivants(x, A), noms = l.map(d => nomS(d.id));
      if (A.ferme && !A.libres.includes(x)) return { msg: l.length ? T.versDeriv(noms) : T.pasDeDeriv, borne, cerne: l.length === 1 ? l[0].id : noeudDe(sx) };
      if (!l.length) return { msg: A.ferme ? T.rejoindre(nx) : T.boucleDabord, borne };
      if (l.length === 1) return { msg: estG ? T.premier(nx, noms[0]) : T.suivant(nx, noms[0]), borne, cerne: l[0].id };
      return { msg: estG ? T.premierOu(nx, noms) : T.suivantOu(nx, noms), borne };
    }
    const msgBorne = (d, b) => (d.type === 'amperemetre' ? (b === 'mA' ? T.dixA : T.ampBornes) : d.type === 'voie' ? (b === '1' ? T.voieRouge(d.voie) : T.voieMasse) : T.voltBornes);
    // une autre borne noire de l'oscilloscope est-elle déjà branchée ? (court-circuit si on branche celle-ci ailleurs)
    const autreMasse = ref => st.scene.materiel.some(m => m.type === 'fiche' && m.id + '.2' !== ref && nbFils(m.id + '.2'));
    // fiche de l'oscilloscope mal placée : borne rouge hors du point de sa flèche, borne noire hors de la masse
    function refusFiche(ref, s) {
      const m = mat(ref.split('.')[0]);
      if (m.type !== 'fiche') return null;
      const d = c.dipoles.find(x => x.type === 'voie' && x.voie === m.voie);
      if (!d) return { msg: T.voieInutile(m.voie), borne: ref };
      const b = ref.split('.')[1];
      if (s === gr.sommet(d.id + '.' + (b === '1' ? 'a' : 'b'))) return null;
      return { msg: b === '1' ? T.voieRouge(m.voie) : T.voieMasse + (autreMasse(ref) ? ' ' + T.masseCourt : '') + lien('oscilloscope'), borne: ref, cerne: d.id };
    }
    function evaluer(p, q) {
      const [ip] = p.split('.'), [iq] = q.split('.');
      if (ip === iq) return { msg: ip === 'G' ? T.court : ['multimetre', 'fiche'].includes(mat(ip).type) ? T.memeAppareil : T.courtDipole(nomBorne(p)), borne: q };
      if (st.phase === 'boucle') return { msg: T.boucleDabordSchema, borne: q };
      if (st.phase === 'verif' || st.phase === 'fin') return { msg: T.fini, borne: q };
      const A = analyse();
      const affP = ip === 'G' || !!st.aff[ip], affQ = iq === 'G' || !!st.aff[iq];
      if (!affP && !affQ) return { msg: st.scene.fils.length ? T.attacher : T.depart, borne: q };
      if (affP && affQ) return evaluerRelie(p, q, A);
      return affP ? evaluerNouveau(p, q, A) : evaluerNouveau(q, p, A);
    }
    // borne d'un appareil déjà branché qui ne convient pas à sa fonction
    function borneRefusee(ref) {
      const it = ref.split('.')[0], f = st.aff[it];
      return f ? msgBorne(sch(f.dip), ref.split('.')[1]) : T.pasRelies;
    }
    // fil entre deux objets déjà sur la table : il doit relier deux bornes d'un même point du schéma
    function evaluerRelie(p, q, A) {
      const sp = sommetDe(p), sq = sommetDe(q);
      if (sp == null) return { msg: borneRefusee(p), borne: p };
      if (sq == null) return { msg: borneRefusee(q), borne: q };
      for (const t of [p, q]) { const f = st.aff[t.split('.')[0]]; if (f && sch(f.dip).type === 'amperemetre' && t.endsWith('.mA')) return { msg: T.dixA, borne: t }; }
      if (!A.dansG(p) && !A.dansG(q)) return { msg: T.attacher, borne: q };
      if ((sp === gr.plus && sq === gr.moins) || (sp === gr.moins && sq === gr.plus)) return { msg: T.court, borne: q };
      if (sp !== sq) {
        const rf = refusFiche(p, sq) || refusFiche(q, sp);
        if (rf) return rf;
        const x = A.libres.includes(p) ? p : A.libres.includes(q) ? q : null;
        return x ? conseil(x, A, x === p ? q : p) : { msg: T.pasRelies, borne: q };
      }
      if (A.W.f(p) === A.W.f(q)) return { msg: T.dejaRelies, borne: q };
      for (const t of [p, q]) if (nbFils(t) && !gr.jonction(sp)) return { msg: T.noeud, borne: t };
      return { ok: true, x: p, y: q };
    }
    // fil de la borne x (montage) vers la borne y d'un objet pas encore placé
    function evaluerNouveau(x, y, A) {
      const sx = sommetDe(x);
      if (sx == null) return { msg: borneRefusee(x), borne: x };
      if (!A.dansG(x)) return { msg: T.attacher, borne: x };
      if (!A.libres.includes(x)) {
        const l = A.libres.find(t => !t.startsWith('G.'));
        if (!A.ferme) return { msg: x === A.fermeture && l ? T.finirG(nomBorne(l)) : T.boucleDabord, borne: y };
        if (l) return { msg: T.finirDeriv(nomBorne(l)), borne: y };
      }
      if (nbFils(x) && !gr.jonction(sx)) return { msg: T.noeud, borne: x };
      const M = mat(y.split('.')[0]), b = y.split('.')[1], used = dipsAff();
      if (M.type === 'fiche') {
        if (!A.ferme && A.libres.includes(x)) return { msg: T.oscBoucle + lien('oscilloscope'), borne: y };
        const rf = refusFiche(y, sx);
        if (rf) return rf;
      }
      const tDe = d => (gr.sommet(d.id + '.a') === sx ? 'a' : 'b');
      const cands = suivants(x, A).filter(d => !used.has(d.id) && sorte(d) === M.sorte);
      const valides = cands.filter(d => borneValide(d, b, tDe(d)));
      if (valides.length) { const d = valides[0]; return { ok: true, x, y, d: d.id, t: tDe(d) }; }
      if (cands.length) return { msg: msgBorne(cands[0], b), borne: y };
      // dipôles de même sorte reliés au point de x, mais refusés pour la boucle principale
      const adj = c.dipoles.filter(d => d.id !== G.id && !used.has(d.id) && sorte(d) === M.sorte && (gr.sommet(d.id + '.a') === sx || gr.sommet(d.id + '.b') === sx));
      if (!A.ferme && adj.length && A.libres.includes(x)) {
        if (adj.every(d => d.type === 'voltmetre')) return { msg: T.voltSerie + lien('multimetre'), borne: y, cerne: adj[0].id };
        const d = adj.find(e => e.type !== 'voltmetre');
        if (d && st.imposee && !st.imposee.has(d.id)) return { msg: `${T.horsBoucle} ${conseil(x, A).msg}`, borne: y };
        if (d) return { msg: T.impasse, borne: y };
      }
      return conseil(x, A, y);
    }

    // ---------- état complet, sens des appareils ----------
    // chaque dipôle (sauf exclus) est sur la table et chaque point du schéma est un seul nœud de la table
    function complet(A, exclus) {
      if (st.scene.fils.some(f => f.pont)) return false;
      const used = dipsAff();
      if (c.dipoles.some(d => d.id !== G.id && !(exclus && exclus.has(d.id)) && !used.has(d.id))) return false;
      const grp = {}, refs = ['G.plus', 'G.moins'];
      Object.keys(st.aff).forEach(id => refs.push(...bornesItem(id)));
      for (const t of refs) { const s = sommetDe(t), r = A.W.f(t); if (grp[s] == null) grp[s] = r; else if (grp[s] !== r) return false; }
      return true;
    }
    // DEL ou appareil de mesure branché à l'envers
    function problemesSens(ids) {
      const l = [];
      Object.keys(st.aff).forEach(id => {
        const f = st.aff[id], d = sch(f.dip);
        if (ids && !ids.includes(d.id)) return;
        if (d.type === 'del' && f.t1 !== plusDe(d)) l.push({ id: d.id, msg: T.delEnvers });
        if (genre(d.type) === 'multimetre' && d.com && f.com !== comS(d)) l.push({ id: d.id, msg: d.type === 'amperemetre' ? T.ampEnvers(nomS(d.id)) : T.voltEnvers(nomS(d.id)) + lien('multimetre') });
      });
      return l;
    }
    const interrupteursOuverts = () => st.scene.materiel.some(m => m.type === 'interrupteur' && !m.ferme);

    // ---------- mode mesurer : circuit déjà monté, appareils à ajouter ----------
    // Chaque point du schéma est câblé en chaîne (générateur d'abord, appareils en dernier) ; un ampèremètre
    // à ajouter est remplacé par un seul fil, le « pont », entre les deux points qu'il reliera.
    function precabler() {
      const ajout = new Set(opts.mesurer);
      const mm = st.scene.materiel.filter(m => m.type === 'multimetre'), pl = st.scene.materiel.filter(m => !['generateur', 'multimetre'].includes(m.type));
      c.dipoles.forEach(d => {
        if (d.id === G.id || ajout.has(d.id)) return;
        let m;
        if (genre(d.type) === 'multimetre') { m = mm.shift(); st.aff[m.id] = { dip: d.id, com: comS(d) }; }
        else { m = pl.find(x => x.sorte === sorte(d)); pl.splice(pl.indexOf(m), 1); st.aff[m.id] = { dip: d.id, t1: d.type === 'del' ? plusDe(d) : 'a' }; }
        st.ordre[m.id] = ++st.n;
      });
      const pts = {};
      const ajouter = (s, ref, rang) => (pts[s] = pts[s] || []).push([rang, ref]);
      ajouter(gr.plus, 'G.plus', 0); ajouter(gr.moins, 'G.moins', 0);
      Object.keys(st.aff).forEach(id => bornesItem(id).forEach(ref => ajouter(sommetDe(ref), ref, ['multimetre', 'fiche'].includes(mat(id).type) ? 2 : 1)));
      Object.keys(pts).forEach(s => {
        pts[s] = pts[s].sort((x, y) => x[0] - y[0]).map(x => x[1]);
        for (let i = 1; i < pts[s].length; i++) st.scene.fils.push(Object.assign([pts[s][i - 1], pts[s][i]], { pre: true }));
      });
      opts.mesurer.forEach(id => {
        if (sch(id).type !== 'amperemetre') return;
        const u = pts[gr.sommet(id + '.a')], v = pts[gr.sommet(id + '.b')];
        st.scene.fils.push(Object.assign([u[u.length - 1], v[0]], { pre: true, pont: id }));
      });
    }
    // étapes de chaque appareil ajouté
    function etapesMesure() {
      const l = [];
      opts.mesurer.forEach(id => {
        if (sch(id).type === 'amperemetre') ['debrancher', 'brancher', 'cal10', 'versmA', 'calmA', 'lire'].forEach(e => l.push({ id, e }));
        else if (sch(id).type === 'voie') l.push({ id, e: 'brancher' });
        else ['brancher', 'calmax', 'calV', 'lire'].forEach(e => l.push({ id, e }));
      });
      return l;
    }
    const intensite = m => Math.abs(st.res.I[m.id] || 0);
    const tension = m => Math.abs(st.res.V[m.id + '.V'] - st.res.V[m.id + '.COM']);
    const meilleurA = m => ['A2m', 'A20m', 'A200m'].find(id => intensite(m) * 1000 < posDe(id).max * .9995) || 'A10';
    const meilleurV = m => ['V200m', 'V2', 'V20', 'V200', 'V600'].find(id => { const q = posDe(id); return tension(m) * (q.k || 1) < q.max * .9995; }) || 'V600';
    const aVenir = E => new Set(opts.mesurer.slice(opts.mesurer.indexOf(E.id) + 1));
    function etapeFaite(E, A) {
      const it = itemDe(E.id), m = it && mat(it);
      if (E.e === 'debrancher') return !st.scene.fils.some(f => f.pont === E.id);
      if (E.e === 'brancher') return !!m && complet(A, aVenir(E)) && !problemesSens([E.id]).length;
      if (E.e === 'lire') return !!st.lu[E.id];
      if (!m) return false;
      const grand = intensite(m) >= .2;
      if (E.e === 'cal10') return m.position === 'A10' && entreeA(st.scene, m) === '10A';
      if (E.e === 'versmA') return grand || entreeA(st.scene, m) === 'mA';
      if (E.e === 'calmA') return grand || (m.position === meilleurA(m) && !!m.mesure && !m.mesure.depasse);
      if (E.e === 'calmax') return m.position === 'V600';
      if (E.e === 'calV') return m.position === meilleurV(m) && !!m.mesure && !m.mesure.depasse;
      return false;
    }
    // conseil pendant un réglage (sans erreur comptée)
    function indiceReglage(E) {
      const it = itemDe(E.id), m = it && mat(it);
      if (!m || m.position === 'OFF') return null;
      const p = posDe(m.position), dep = m.mesure && m.mesure.depasse;
      if (E.e === 'cal10') return p.zone !== 'A⎓' ? T.fonctionA : T.commencer10;
      if (E.e === 'calmA') return p.zone !== 'A⎓' ? T.fonctionA : dep ? T.depasse : p.id === 'A10' ? T.entreeMA : T.plusPetit;
      if (E.e === 'calmax') return p.zone !== 'V⎓' ? T.fonctionV : T.commencer600;
      if (E.e === 'calV') return p.zone !== 'V⎓' ? T.fonctionV : dep ? T.depasse : T.plusPetit;
      return null;
    }
    function avancerMesure() {
      const A = analyse();
      // calibre changé pendant la lecture : retour au choix du calibre
      while (L[st.k] && L[st.k].e === 'lire' && !st.lu[L[st.k].id] && st.k > 0 && L[st.k - 1].id === L[st.k].id && !etapeFaite(L[st.k - 1], A)) { st.k--; st.retourLu = null; }
      while (st.k < L.length && etapeFaite(L[st.k], A)) { st.k++; st.retourLu = null; st.saisie = ''; }
      const E = L[st.k];
      st.sensKO = E && E.e === 'brancher' && itemDe(E.id) && complet(A, aVenir(E)) ? problemesSens([E.id]) : null;
      if (st.sensKO && !st.sensKO.length) st.sensKO = null;
      if (!E && st.phase !== 'fin') st.phase = 'fin';
    }
    // nom des deux bornes reliées par le pont (pour l'élève)
    const nomsPont = id => { const f = st.scene.fils.find(x => x.pont === id) || st.pontRetire[id]; return f ? [nomBorne(f[0]), nomBorne(f[1])] : ['', '']; };
    // dipôle aux bornes duquel se branche un voltmètre
    const auxBornes = id => { const u = gr.sommet(id + '.a'), v = gr.sommet(id + '.b'); const l = c.dipoles.filter(x => x.id !== id && !appareil(x.type) && [gr.sommet(x.id + '.a'), gr.sommet(x.id + '.b')].sort().join() === [u, v].sort().join());
      const d = l.find(x => x.id !== G.id) || l[0]; return d ? nomS(d.id) : 'le dipôle'; };
    // bornes libérées par le pont, côté entrée (10A) et côté COM de l'ampèremètre
    function bornesLiberees(id) {
      const f = st.pontRetire[id], d = sch(id);
      if (!f) return ['', ''];
      const sCom = gr.sommet(id + '.' + comS(d)), [x, y] = sommetDe(f[0]) === sCom ? [f[1], f[0]] : [f[0], f[1]];
      return [nomBorne(x), nomBorne(y)];
    }
    // voie de l'oscilloscope : la fiche de la voie, borne rouge au point de la flèche, borne noire à la masse
    function evaluerVoie(p, q, d) {
      const estF = t => mat(t.split('.')[0]).type === 'fiche';
      if (estF(p) && estF(q)) return { msg: T.ficheFiche, borne: q };
      if (!estF(p) && !estF(q)) return { msg: T.lieuVoie(d.voie), borne: q };
      const [x, y] = estF(p) ? [q, p] : [p, q], b = y.split('.')[1];
      if (mat(y.split('.')[0]).voie !== d.voie) return { msg: T.autreVoie(d.voie), borne: y };
      if (nbFils(y)) return { msg: T.unFil, borne: y };
      const sx = sommetDe(x);
      if (sx == null) return { msg: T.lieuVoie(d.voie), borne: x };
      const rf = refusFiche(y, sx);
      if (rf) return rf;
      if (nbFils(x) && !gr.jonction(sx)) return { msg: T.noeud, borne: x };
      return { ok: true, x, y, d: itemDe(d.id) ? undefined : d.id, t: b === '1' ? 'a' : 'b' };
    }
    function evaluerMesure(p, q) {
      const E = L[st.k];
      if (!E) return { msg: T.fini, borne: q };
      if (E.e === 'debrancher') return { msg: T.debrancherDabord, borne: q };
      if (E.e !== 'brancher') return { msg: T.reglerMaintenant, borne: q };
      if (sch(E.id).type === 'voie') return evaluerVoie(p, q, sch(E.id));
      const d = sch(E.id), deja = itemDe(E.id);
      const estM = t => { const m = mat(t.split('.')[0]); return m.type === 'multimetre' && (!st.aff[m.id] || st.aff[m.id].dip === E.id); };
      const lieu = () => (d.type === 'amperemetre' ? T.lieuA(...bornesLiberees(E.id)) : T.lieuV(auxBornes(E.id)));
      if (estM(p) && estM(q)) return { msg: T.memeAppareil, borne: q };
      if (!estM(p) && !estM(q)) return { msg: lieu(), borne: q };
      const [x, y] = estM(p) ? [q, p] : [p, q], it = y.split('.')[0], b = y.split('.')[1];
      if (deja && deja !== it) return { msg: T.memeMultimetre, borne: y };
      if (!borneValide(d, b)) return { msg: msgBorne(d, b), borne: y };
      if (nbFils(y)) return { msg: T.unFil, borne: y };
      const sx = sommetDe(x);
      if (sx == null) return { msg: lieu(), borne: x };
      const ta = gr.sommet(E.id + '.a') === sx, tb = gr.sommet(E.id + '.b') === sx;
      if (!ta && !tb) return { msg: lieu(), borne: x };
      if (nbFils(x) && !gr.jonction(sx)) return { msg: T.noeud, borne: x };
      if (!deja) return { ok: true, x, y, d: E.id, t: ta ? 'a' : 'b' };
      if (sommetDe(y) !== sx) return { msg: lieu(), borne: x };
      return { ok: true, x, y };
    }
    function lireMesure() {
      const E = L[st.k];
      if (!E || E.e !== 'lire') return;
      const m = mat(itemDe(E.id)), d = sch(E.id), r = lireValeur(st.saisie);
      if (!m.mesure || m.mesure.depasse) { st.retourLu = { msg: T.depasse, faux: true }; maj(); return; }
      if (!r) { st.retourLu = { msg: T.lireFormat }; maj(); return; }
      const fam = d.type === 'amperemetre' ? 'A' : 'V', p = posDe(m.position), v = m.mesure.v / (p.k || 1);
      let diag = null;
      if (r.famille !== fam) diag = fam === 'A' ? T.lireUniteA : T.lireUniteV;
      else if (Math.abs(r.v - v) > Math.max(.6 * Math.pow(10, -p.dec) / (p.k || 1), .01 * Math.abs(v))) {
        diag = [1000, .001].some(k => Math.abs(r.v * k - v) <= .01 * Math.abs(v)) ? T.lireMilli : T.lireFaux;
      }
      if (diag) { st.refus++; st.retourLu = { msg: diag, faux: true }; maj(); return; }
      st.lu[E.id] = m.mesure.texte;
      apresChangement();
    }

    // ---------- gestes ----------
    function toucheSchema(cible) {
      if (st.phase !== 'boucle' || (cible.type !== 'fil' && cible.type !== 'dipole')) return;
      const i = st.choisis.indexOf(cible.id);
      if (i >= 0) st.choisis.splice(i, 1); else st.choisis.push(cible.id);
      st.diagBoucle = null; st.cerne = null;
      maj();
    }
    function verifier() {
      if (st.phase !== 'boucle') return;
      const r = verifierBoucle(c, st.choisis, opts.textes);
      if (!r.ok) { st.refus++; st.diagBoucle = r.diag + lien('reperer'); st.cerne = r.cerne || null; maj(); return; }
      st.diagBoucle = null; st.cerne = null; st.info = T.boucleOk;
      st.imposee = new Set(r.choisis);
      st.phase = 'fils';
      apresChangement();
    }
    // déplacement d'une fiche sur un même multimètre (10A → mA)
    function deplacerFiche(p, q) {
      const [tp, bp] = p.split('.'), [tq, bq] = q.split('.');
      if (tp !== tq || mat(tp).type !== 'multimetre' || !['10A', 'mA'].includes(bp) || !['10A', 'mA'].includes(bq)) return false;
      const [de0, vers] = nbFils(p) ? [p, q] : [q, p];
      if (!nbFils(de0) || nbFils(vers)) return true;
      const E = L[st.k];
      if (!mesure || !E || E.e !== 'versmA' || !vers.endsWith('.mA')) { vTab.refus(vers, `<b>Pas encore.</b> ${T.dixA}`); return true; }
      const f = st.scene.fils.find(x => x.includes(de0));
      f[f.indexOf(de0)] = vers;
      apresChangement();
      return true;
    }
    function fil(p, q) {
      if (st.phase === 'fin') return;
      st.info = null; st.cerne = null;
      if (deplacerFiche(p, q)) return;
      const r = mesure ? evaluerMesure(p, q) : evaluer(p, q);
      if (!r.ok) {
        st.refus++;
        if (r.cerne) st.cerne = r.cerne;
        vTab.refus(r.borne || q, `<b>Ce n'est pas ça.</b> ${r.msg}`);
        maj();
        if (opts.onChange) opts.onChange(api);
        return;
      }
      st.scene.fils.push([r.x, r.y]);
      if (r.d) {
        const [id, b] = r.y.split('.'), d = sch(r.d);
        // r.t : borne du schéma reliée à la borne y
        st.aff[id] = genre(d.type) === 'multimetre' ? { dip: r.d, com: b === 'COM' ? r.t : autreT(r.t) } : { dip: r.d, t1: b === '1' ? r.t : autreT(r.t) };
        st.ordre[id] = ++st.n;
      }
      apresChangement();
    }
    function retirable(i) {
      const f = st.scene.fils[i];
      if (!f || st.phase === 'fin') return false;
      if (!mesure) return true;
      const E = L[st.k];
      if (f.pont) return !!E && E.e === 'debrancher' && f.pont === E.id;
      if (f.pre) return false;
      return !!E && E.e === 'brancher' && [f[0], f[1]].some(t => st.aff[t.split('.')[0]] && st.aff[t.split('.')[0]].dip === E.id);
    }
    function filTouche(i) {
      const f = st.scene.fils[i], E = L[st.k];
      if (!f || !mesure || !E) return;
      if (f.pre && E.e === 'debrancher') st.info = `${T.pasCeFil} ${T.debrancher(...nomsPont(E.id))}`;
      else if (f.pre) st.info = E.e === 'brancher' && sch(E.id).type === 'voltmetre' ? T.voltSansDebrancher : E.e === 'brancher' && sch(E.id).type === 'voie' ? T.oscSansDebrancher : T.pasToucher;
      else st.info = T.dejaBien;
      maj();
    }
    function retirer(i) {
      if (!retirable(i)) return;
      const f = st.scene.fils.splice(i, 1)[0];
      if (f.pont) st.pontRetire[f.pont] = f;
      st.retraits++;
      st.info = null; st.cerne = null;
      // un objet qui n'a plus de fil redevient libre
      Object.keys(st.aff).forEach(id => { if (!Object.keys(descMat(mat(id)).bornes).some(b => nbFils(id + '.' + b))) delete st.aff[id]; });
      apresChangement();
    }
    function commande(id, nom, v) {
      if (st.phase === 'fin' && !mesure) return;
      const m = mat(id);
      if (nom === 'levier') m.ferme = !m.ferme;
      if (nom === 'marche') m.marche = !m.marche;
      if (nom === 'position') m.position = v;
      if (nom === 'tension') m.tension = v;
      apresChangement();
    }
    function apresChangement() {
      st.res = calculer(st.scene);
      if (mesure) avancerMesure();
      else if (st.phase !== 'boucle' && st.phase !== 'fin') {
        const A = analyse();
        if (A.ferme) st.retraits = 0;                   // boucle refermée : fin de la réparation
        st.phase = complet(A) ? 'verif' : 'fils';
        st.sensKO = null;
        if (st.phase === 'verif' && gen().marche && !interrupteursOuverts()) {
          const pb = problemesSens();
          if (pb.length) { st.sensKO = pb; st.cerne = pb[0].id; } else st.phase = 'fin';
        }
      }
      maj();
      if (opts.onChange) opts.onChange(api);
      if (st.phase === 'fin' && !st.finSignale) {
        st.finSignale = true;
        vTab.actif(false);
        if (opts.onFin) opts.onFin({ refus: st.refus, mesures: Object.assign({}, st.lu) });
      }
    }

    // ---------- affichage ----------
    // boucle principale réalisée : la plus ancienne suite de dipôles (ordre de pose) qui relie les deux bornes du générateur
    function boucleConstruite(A) {
      const fils = st.scene.fils.filter(f => !f.pont);
      const items = Object.keys(st.aff).filter(id => !enDerivation(sch(st.aff[id].dip).type) && A.dansG(bornesItem(id)[0])).sort((x, y) => st.ordre[x] - st.ordre[y]);
      const ids = new Set();
      if (!fils.length) return ids;
      if (!A.ferme) {
        ids.add(G.id);
        items.forEach(id => ids.add(st.aff[id].dip));
        fils.forEach(([p, q]) => { const a0 = borneS(p), b0 = borneS(q); if ((p.startsWith('G.') || items.includes(p.split('.')[0])) && (q.startsWith('G.') || items.includes(q.split('.')[0])) && a0 && b0) gr.chemin(a0, b0).forEach(x => ids.add(x)); });
        return ids;
      }
      let pris = items;
      for (let k = 1; k <= items.length; k++) {
        const U = unions();
        fils.forEach(([p, q]) => U.u(p, q));
        items.slice(0, k).forEach(id => { const [x, y] = bornesItem(id); U.u(x, y); });
        if (U.f('G.plus') === U.f('G.moins')) { pris = items.slice(0, k); break; }
      }
      // parcours en largeur de G.plus à G.moins par les fils et les dipôles retenus
      const voisins = t => {
        const l = [];
        fils.forEach(([p, q]) => { if (p === t) l.push([q, null]); else if (q === t) l.push([p, null]); });
        pris.forEach(id => { const [x, y] = bornesItem(id); if (x === t) l.push([y, id]); else if (y === t) l.push([x, id]); });
        return l;
      };
      const prec = { 'G.plus': null }, file = ['G.plus'];
      while (file.length) {
        const t = file.shift();
        if (t === 'G.moins') break;
        voisins(t).forEach(([u, id]) => { if (!(u in prec)) { prec[u] = [t, id]; file.push(u); } });
      }
      if (!('G.moins' in prec)) return ids;
      const suite = [];
      for (let t = 'G.moins'; prec[t]; t = prec[t][0]) if (prec[t][1]) suite.unshift([prec[t][0], t, prec[t][1]]);
      ids.add(G.id);
      let sortie = plusS;
      suite.forEach(([e, s, id]) => { const be = borneS(e); gr.chemin(sortie, be).forEach(x => ids.add(x)); ids.add(st.aff[id].dip); sortie = borneS(s); });
      gr.chemin(sortie, moinsS).forEach(x => ids.add(x));
      return ids;
    }
    function maj() {
      const A = analyse();
      // étiquettes des appareils de mesure
      st.scene.materiel.forEach(m => {
        if (m.type !== 'multimetre') return;
        const f = st.aff[m.id], d = f && sch(f.dip);
        m.etiquette = d && d.mesure ? (d.type === 'amperemetre' ? 'A · ' : 'V · ') + indice(d.mesure).replace(/<\/?sub>/g, '') : '';
      });
      const etats = {};
      Object.keys(st.aff).forEach(id => {
        const d = sch(st.aff[id].dip), m = mat(id);
        if (d.type === 'interrupteur') etats[d.id] = { ouvert: !m.ferme };
        if (d.type === 'lampe') etats[d.id] = { allumee: !!m.eclat };
      });
      // surlignage : éléments branchés (fils du schéma correspondant aux fils de la table) et boucle principale
      const branches = new Set();
      if (st.scene.fils.some(f => !f.pont)) branches.add(G.id);
      Object.values(st.aff).forEach(f => branches.add(f.dip));
      st.scene.fils.forEach(f => { if (f.pont) return; const a0 = borneS(f[0]), b0 = borneS(f[1]); if (a0 && b0) gr.chemin(a0, b0).forEach(x => branches.add(x)); });
      const boucle = st.imposee ? st.imposee : mesure ? new Set() : boucleConstruite(A);
      const allumes = (c.noeuds || []).filter(n => { const inc = c.fils.filter(w => w.a === n.id || w.b === n.id); return inc.length && inc.every(w => branches.has(w.id)); }).map(n => n.id);
      let cerne = st.cerne;
      if (mesure && !cerne && L[st.k] && ['debrancher', 'brancher'].includes(L[st.k].e)) cerne = L[st.k].id;
      vSch.maj({ libre: st.phase === 'boucle', choisis: st.phase === 'boucle' ? st.choisis : [], boucle: Array.from(boucle),
                 branches: Array.from(branches), allumes, cerne, etats });
      vTab.dessiner();
      consigne(A);
      deroule(A);
    }
    function consigneFils(A) {
      if (!st.scene.fils.length) return T.cDepart;
      const l = A.libres.filter(t => !t.startsWith('G.'));
      if (!A.ferme) {
        if (l.length) return sommetDe(l[0]) === pointFermeture(l[0], A) ? T.cFermer(nomBorne(l[0])) : T.cSuite(nomBorne(l[0]));
        return A.libres.length && !Object.keys(st.aff).length ? T.cDepart : T.cReprendre;
      }
      if (l.length) {
        const m = mat(l[0].split('.')[0]);
        if (m.type === 'fiche') return l[0].endsWith('.1') ? T.cVoieRouge(m.voie) : T.cVoieMasse(m.voie);
        return pointAtteint(l[0], A) ? T.cRejoindre(nomBorne(l[0])) : T.cDerivSuite(nomBorne(l[0]));
      }
      const reste = c.dipoles.filter(d => d.id !== G.id && !dipsAff().has(d.id));
      return !reste.length ? T.cReprendre : reste.every(d => d.type === 'voie') ? T.cOscillo : T.cDeriv;
    }
    function consigneMesure() {
      const E = L[st.k];
      if (!E) return '';
      const it = itemDe(E.id), m = it && mat(it), d = sch(E.id);
      let h = '';
      if (E.e === 'debrancher') h = `<p>${T.debrancher(...nomsPont(E.id))}</p>`;
      else if (E.e === 'brancher') h = `<p>${d.type === 'amperemetre' ? T.cBrancherA(...bornesLiberees(E.id)) : d.type === 'voie' ? T.cBrancherVoie(d.voie, d.mesure && indice(d.mesure)) : T.cBrancherV(auxBornes(E.id))}</p>`;
      else if (E.e === 'cal10') h = `<p>${T.cCal10}</p>`;
      else if (E.e === 'versmA') h = `<p>${T.cVersmA(m.affiche || '0.00')}</p>`;
      else if (E.e === 'calmA') h = `<p>${T.cCalmA}</p>`;
      else if (E.e === 'calmax') h = `<p>${T.cCalmax}</p>`;
      else if (E.e === 'calV') h = `<p>${T.cCalV(m.affiche || '')}</p>`;
      else if (E.e === 'lire') {
        const n = d.mesure || (d.type === 'amperemetre' ? 'I' : 'U');
        h = `<p>${T.cLire((d.type === 'amperemetre' ? 'l\'intensité ' : 'la tension ') + indice(n))}</p>
          <div class="mt-lecture"><span class="mt-lab">${indice(n)} =</span><input type="text" class="mt-champ" inputmode="text" autocomplete="off" spellcheck="false"
            aria-label="Valeur lue avec son unité" placeholder="${d.type === 'amperemetre' ? '16,3 mA' : '6,37 V'}"><button type="button" class="btn-primary mt-lire-ok" data-a="lire">Valider</button></div>`;
        if (st.retourLu) h += `<div class="${st.retourLu.faux ? 'callout-danger' : 'callout'} mt-diag">${st.retourLu.faux ? '<b>Ce n\'est pas ça.</b> ' : ''}${st.retourLu.msg}</div>`;
      }
      const ind = ['cal10', 'calmA', 'calmax', 'calV'].includes(E.e) ? indiceReglage(E) : null;
      if (ind) h += `<p class="mt-indice">${ind}</p>`;
      return h;
    }
    function consigne(A) {
      const actif = document.activeElement && document.activeElement.classList.contains('mt-champ') && zCons.contains(document.activeElement);
      let h = '';
      if (st.phase === 'boucle') {
        h = `<p>${T.cBoucle}</p><div class="mt-cons-actions"><button type="button" class="btn-small" data-a="verifier">Vérifier</button></div>`;
        if (st.diagBoucle) h += `<div class="callout-danger mt-diag"><b>Ce n'est pas ça.</b> ${st.diagBoucle}</div>`;
      } else if (st.phase === 'fin') h = `<p class="mt-ok"><b>Juste !</b> ${!mesure ? T.fin : opts.mesurer.every(id => sch(id).type === 'voie') ? T.finOsc : 'Les mesures sont faites.'}</p>`;
      else if (mesure) h = consigneMesure();
      else if (st.phase === 'verif') {
        if (st.sensKO) h = st.sensKO.map(p => `<div class="callout-danger mt-diag"><b>Ce n'est pas ça.</b> ${p.msg}</div>`).join('');
        else if (gen().marche && interrupteursOuverts()) h = `<p>${T.cInterrupteur}</p>`;
        else h = `<p>${T.cVerifier(interrupteursOuverts())}</p>`;
      } else h = `<p>${consigneFils(A)}</p>`;
      if (mesure && st.sensKO) h += st.sensKO.map(p => `<div class="callout-danger mt-diag"><b>Ce n'est pas ça.</b> ${p.msg}</div>`).join('');
      const lus = Object.keys(st.lu).map(id => `<span>${indice(sch(id).mesure || id)} = ${st.lu[id]}</span>`);
      if (lus.length) h += `<p class="mt-mesures">${lus.join('')}</p>`;
      if (st.info) h = `<p class="mt-info">${st.info}</p>` + h;
      zCons.innerHTML = h;
      const b = zCons.querySelector('[data-a="verifier"]');
      if (b) b.onclick = verifier;
      const ch = zCons.querySelector('.mt-champ');
      if (ch) {
        ch.value = st.saisie;
        ch.addEventListener('input', () => { st.saisie = ch.value; });
        ch.addEventListener('keydown', ev => { if (ev.key === 'Enter') lireMesure(); });
        zCons.querySelector('[data-a="lire"]').onclick = lireMesure;
        if (actif || (st.focusLire !== st.k && matchMedia('(hover: hover)').matches)) { st.focusLire = st.k; ch.focus({ preventScroll: true }); }
      }
    }
    function deroule(A) {
      const ol = zone.querySelector('.mt-deroule');
      let l = [];
      if (mesure) {
        const lab = E => {
          const d = sch(E.id), n = indice(d.mesure || (d.type === 'amperemetre' ? 'I' : 'U'));
          return { debrancher: 'Débranche le fil à la place duquel se met l\'ampèremètre.', cal10: 'Règle-le sur A⎓, calibre 10 A.',
            versmA: 'Passe la fiche de l\'entrée 10A à l\'entrée mA.', calmA: 'Choisis le calibre en mA le plus adapté.',
            calmax: 'Règle-le sur V⎓, calibre 600 V.', calV: 'Choisis le calibre le plus adapté.', lire: `Lis ${d.type === 'amperemetre' ? 'l\'intensité' : 'la tension'} ${n}.`,
            brancher: d.type === 'amperemetre' ? 'Branche l\'ampèremètre en série : bornes 10A et COM.' : d.type === 'voie' ? `Branche la voie CH${d.voie}${d.mesure ? ` (tension ${n})` : ''} : borne rouge au point de la flèche, borne noire à la masse.` : 'Branche le voltmètre en dérivation : bornes V et COM.' }[E.e];
        };
        l = L.map((E, i) => [lab(E), i < st.k, i === st.k]);
      } else {
        const deriv = Object.values(gr.deg).some(n => n >= 3), fini = st.phase === 'verif' || st.phase === 'fin';
        const bl = A.libres.filter(t => !t.startsWith('G.'));
        const boucleFaite = A.ferme || fini || (bl.length === 1 && sommetDe(bl[0]) === pointFermeture(bl[0], A));
        if (opts.boucle) l.push(['Surligne la boucle principale sur le schéma.', st.phase !== 'boucle']);
        l.push(['Réalise la boucle principale : pars d\'une borne du générateur et suis les dipôles dans l\'ordre du schéma.', boucleFaite]);
        l.push(['Ferme la boucle sur l\'autre borne du générateur.', A.ferme || fini]);
        if (deriv) l.push([c.dipoles.some(d => d.type === 'voie') ? 'Ajoute les dérivations, une par une : chaque voie de l\'oscilloscope en est une, de son point à la masse.' : 'Ajoute les dérivations, une par une.', fini]);
        l.push([c.dipoles.some(d => d.type === 'interrupteur') ? 'Ferme l\'interrupteur et allume le générateur : le montage est vérifié.' : 'Allume le générateur : le montage est vérifié.', st.phase === 'fin']);
        const i = l.findIndex(x => !x[1]);
        l = l.map((x, j) => [x[0], x[1], j === i]);
      }
      // texte dans un span : un indice (<sub>) ne devient pas un élément séparé de la ligne (flex)
      ol.innerHTML = l.map(([t, fait, ici]) => `<li class="${fait ? 'fait' : ici ? 'ici' : 'avenir'}"><span>${t}</span></li>`).join('');
    }

    function init() {
      st = { phase: mesure ? 'mesure' : opts.boucle ? 'boucle' : 'fils', choisis: [], imposee: null, diagBoucle: null, cerne: null, info: null,
             aff: {}, ordre: {}, n: 0, refus: 0, retraits: 0, sensKO: null, finSignale: false,
             k: 0, lu: {}, saisie: '', retourLu: null, pontRetire: {}, focusLire: -1,
             scene: { W: 360, H: 400, materiel: materielInitial(), fils: [] } };
      L = mesure ? etapesMesure() : [];
      if (mesure) precabler();
      if (vTab) vTab.detruire();
      vSch = schema(zSch, c, { com: opts.com, libre: opts.boucle, onTouche: toucheSchema });
      vTab = table(zTab, st.scene, { rendu: opts.rendu, onFil: fil, onRetirer: retirer, onFilTouche: filTouche, onCommande: commande, retirable,
        onLargeur: l => { const W = l >= 520 ? 540 : 360; if (W !== st.scene.W || !st.scene.place) { st.scene.W = W; st.scene.H = disposer(st.scene.materiel, W); st.scene.place = true; } } });
      apresChangement();
    }

    const api = {
      get refus() { return st.refus; },
      fini: () => st.phase === 'fin',
      mesures: () => Object.assign({}, st.lu),
      recommencer: init,
      fil, retirer, commande, verifier,
      toucher: toucheSchema,
      lire(t) { st.saisie = t; lireMesure(); },
      get etat() { return st; },
      circuit: c,
    };
    init();
    return api;
  }

  window.MONTAGE = { TEXTES, POSITIONS, libellePosition, schema, table, graphe, verifierBoucle, boucleParDefaut, calculer, lecture, lireValeur, monter, disposer, afficheur, MAT, nomDe, indice, borneSchema };
})();
