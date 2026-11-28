/* ============================================================
   Exercices du module 4 (application « Énergie et travail ») : les
   exercices 1 à 9 de la feuille, même ordre, même numérotation.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] } ; chaque partie suit le format de ET.PARTIES
   (modules/et.js) avec p.q (question) et p.correction (correction
   détaillée, toujours disponible).
   Ex. 9 (« Un accélérateur au service de l'art ») : questions complexes
   4.1 et 6, proposées telles quelles, puis par étapes sur demande
   (« Je ne sais pas par où commencer »), voir complexe() dans ce fichier.

   Valeurs vérifiées par un script. Écarts avec les corrections :
     ex. 6 : la correction écrit « E_pp » ; pour ces oscillateurs (ressort),
       l'énergie potentielle est élastique (E_p) ;
     ex. 8 2.a : avec v_max non arrondie (v_max² = 2gh = 981 m²·s⁻²),
       E_diss = 1,05 × 10⁴ J ; la correction, avec v_max = 31,3 m·s⁻¹,
       trouve 1,04 × 10⁴ J : les deux sont acceptés ;
     ex. 9 5.3 : la correction écrit « 2,0 × 10⁷ m·s⁻² » : c'est une
       vitesse, en m·s⁻¹ ; la tangente coupe l'axe des temps à environ
       200 ns de la sortie (t_s / 2 ≈ 204 ns), d'où v ≈ 2,0 × 10⁷ m·s⁻¹ ;
     ex. 9 6 : la correction prend Δt = 5 min : N ≈ 9,4 × 10¹³ protons,
       ordre de grandeur 10¹⁴, soit 10⁻¹⁰ mol ; toute durée de quelques
       minutes donne le même ordre de grandeur.
   ============================================================ */
(function () {
  'use strict';
  const ET = window.ET;
  const { o, fmt, sci, proche, V, fr, rac, MS, fl, nom, txt, svg, COUL, ENCRE, ENCRE2, ENCRE3, figPente, schemaMvt } = ET;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c_ = h => `<span class="c">${h}</span>`;
  const G = 'm·s<sup>−2</sup>', g = 9.81, EC = 'E<sub>c</sub>', EPP = 'E<sub>pp</sub>', EM = 'E<sub>m</sub>';
  const TEC = 'D\'après le théorème de l\'énergie cinétique entre A et B, Δ<sub>AB</sub>E<sub>c</sub> = ΣW<sub>AB</sub>';
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options: options.map(x => o(x[0], x[1])), bonne, correction, melanger: false, colonne: options.some(x => x[1].replace(/<[^>]+>/g, '').length > 22) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false, rel: .02, calc: true }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .03, calc: true }, opts);
  const grille = (q, options, lignes, correction, opts) => Object.assign({ type: 'grille', q, options: options.map(x => o(x[0], x[1])), lignes, correction }, opts);

  /* ---------- question complexe ----------
     p = { q, label, valeur, rel, juste(v) (facultatif), unite, diag, etapes: [parties], reflexe } : la question
     telle quelle, puis, sur demande, les étapes ; demander les étapes compte comme une erreur. */
  function complexe(p) {
    return Object.assign({ type: 'perso', monter(zone, api) {
      const d = document.createElement('div');
      d.className = 'et-complexe';
      d.innerHTML = `<div class="ph-valeur"><span class="ph-lab">${p.label}</span><span data-ch></span><span class="ph-unite">${p.unite}</span>${ET.CALC}</div>
        <div class="er-actions"><button type="button" class="btn-primary" data-v>Valider</button><button type="button" class="btn-secondary" data-e>Je ne sais pas par où commencer</button></div>
        <div class="et-complexe-etapes" hidden></div>`;
      zone.appendChild(d);
      const ch = ET.champ({ signe: false });
      d.querySelector('[data-ch]').appendChild(ch.el);
      const bV = d.querySelector('[data-v]'), bE = d.querySelector('[data-e]'), et = d.querySelector('.et-complexe-etapes');
      const finir = () => { ch.desactiver(true); bV.disabled = true; bE.disabled = true; };
      bV.onclick = () => {
        if (api.fini()) return;
        const v = ET.lire(ch.input.value);
        if (isNaN(v)) { api.message('Écris un nombre (avec une virgule si besoin).'); return; }
        if (p.juste ? p.juste(v) : ET.proche(v, p.valeur, p.rel)) { finir(); et.hidden = true; api.reussi(); return; }
        api.erreur((p.diag && p.diag(v)) || 'Vérifie ton raisonnement, ou demande les étapes.');
      };
      bE.onclick = () => {
        if (api.fini() || !et.hidden) return;
        api.compterErreur();
        et.hidden = false; bE.disabled = true;
        et.innerHTML = `<p class="ph-msg">${p.reflexe}</p><div></div>`;
        ET.question(et.lastElementChild, { parties: p.etapes.map(x => Object.assign({}, x)) }, { fin() { finir(); api.reussi(); } }, 'exercice');
      };
      return { montrer() { ch.input.value = p.affiche || ET.fmt(p.valeur); finir(); et.hidden = true; } };
    } }, p);
  }

  /* ---------- figures ---------- */
  // ex. 1 : condensateur, plaques A (+) et B (−) verticales, trajectoire de la particule (en rose sur la feuille)
  function figEx1() {
    let s = '';
    [[60, '+'], [250, '−']].forEach(([x, sg], i) => {
      s += `<rect x="${x - 3}" y="16" width="6" height="150" rx="2" fill="#ebe8e1" stroke="${ENCRE2}"/>` + txt(x, 12, i ? 'B' : 'A', { g: 800, c: ENCRE, t: 13, a: 'middle' });
      for (let y = 40; y < 166; y += 32) s += txt(x + (i ? 14 : -14), y, sg, { g: 800, c: ENCRE, t: 14, a: 'middle' });
    });
    s += `<path d="M63,120 Q100,60 150,56 T247,38" fill="none" stroke="#b0177f" stroke-width="2.6"/><circle cx="150" cy="56" r="4" fill="${ENCRE}"/>` + txt(150, 76, 'C', { g: 800, c: ENCRE, t: 13, a: 'middle' });
    s += fl(110, 140, 190, 140, COUL.E, { ep: 2.4 }) + nom(150, 130, 'E', '', COUL.E, { t: 14 });
    s += `<line x1="60" y1="182" x2="250" y2="182" stroke="${ENCRE2}"/><path d="M66,178 l-6,4 l6,4 M244,178 l6,4 l-6,4" fill="none" stroke="${ENCRE2}"/>` + txt(155, 198, 'd = 10 cm', { g: 700, c: ENCRE, t: 12, a: 'middle' });
    return svg(310, 206, s, 'Condensateur plan : plaque A chargée positivement à gauche, plaque B négativement à droite, champ E de A vers B ; la particule entre près de A, passe par C et atteint B (trajectoire en rose)');
  }
  // ex. 6 : énergies de deux oscillateurs (mJ), régime pseudo-périodique (1) et périodique (2)
  function figEx6(n) {
    const Em = t => (n === 1 ? 30 * Math.exp(-t / .5) : 30), Ep = t => Em(t) * Math.pow(Math.cos(2 * Math.PI * t / .8), 2);
    return ET.courbes({ tmax: 2, ymin: 0, ymax: 33, pasT: .2, pasY: 3, W: 340, H: 200, nomY: 'E (mJ)', series: [
      { f: Em, coul: COUL.Em, nom: 'E<tspan dy="3" font-size="8">m</tspan>', tNom: n === 1 ? .3 : 1.3 },
      { f: Ep, coul: COUL.Epp, nom: 'E<tspan dy="3" font-size="8">p</tspan>', tNom: .02 },
      { f: t => Em(t) - Ep(t), coul: COUL.Ec, nom: n === 2 ? 'E<tspan dy="3" font-size="8">c</tspan>' : '', tNom: .1 }],
      aria: n === 1 ? 'Graphique 1 : l\'énergie mécanique diminue de 30 mJ à presque 0 en 2 s, énergies cinétique et potentielle oscillent en diminuant' : 'Graphique 2 : l\'énergie mécanique reste égale à 30 mJ, énergies cinétique et potentielle oscillent entre 0 et 30 mJ' });
  }
  // ex. 7 : ballon de rugby, E_c, E_pp, E_m (sans graduations)
  function figEx7() {
    const Epp = t => 8 * 4 * t * (1 - t), Em = () => 10, Ec = t => Em() - Epp(t), u1 = (1 - Math.sqrt(1 - 4 * 5 / 32)) / 2;
    return ET.courbes({ tmax: 1, ymin: 0, ymax: 11, pasT: 2, pasY: 20, W: 330, H: 190, nomY: 'E (J)', series: [
      { f: Em, coul: COUL.Em, nom: 'E<tspan dy="3" font-size="8">m</tspan>', tNom: .55 },
      { f: Epp, coul: COUL.Epp, nom: 'E<tspan dy="3" font-size="8">pp</tspan>', tNom: .3 },
      { f: Ec, coul: COUL.Ec, nom: 'E<tspan dy="3" font-size="8">c</tspan>', tNom: .86 }],
      points: [[u1, 5, 't₁'], [.5, 8, 't₂'], [1 - u1, 5, 't₃']],
      aria: 'Énergies d\'un ballon : E_m constante ; E_pp nulle au départ, maximale à t₂, nulle à la fin ; E_c maximale au départ, minimale à t₂ ; E_c = E_pp aux instants t₁ et t₃' });
  }
  // ex. 9 : accélérateur AGLAÉ (armatures A et B séparées de d = 4 m, champ de A vers B)
  function figEx9() {
    let s = `<line x1="80" y1="14" x2="80" y2="136" stroke="${ENCRE2}" stroke-width="3"/><line x1="260" y1="14" x2="260" y2="136" stroke="${ENCRE2}" stroke-width="3"/>`;
    s += txt(72, 24, 'Armature A', { g: 700, c: ENCRE, t: 11, a: 'end' }) + txt(268, 24, 'Armature B', { g: 700, c: ENCRE, t: 11 });
    s += fl(20, 76, 320, 76, ENCRE, { ep: 1.3, lt: 8 }) + txt(318, 68, 'x', { g: 800, c: ENCRE, t: 12, a: 'end' });
    [[120, 46], [190, 46], [120, 108], [190, 108]].forEach(([x, y]) => { s += fl(x, y, x + 40, y, COUL.E, { ep: 2 }) + nom(x + 20, y - 8, 'E', '', COUL.E, { t: 12 }); });
    s += `<line x1="80" y1="150" x2="260" y2="150" stroke="${ENCRE2}"/><path d="M86,146 l-6,4 l6,4 M254,146 l6,4 l-6,4" fill="none" stroke="${ENCRE2}"/>` + txt(170, 166, 'd = 4 m', { g: 700, c: ENCRE, t: 12, a: 'middle' });
    return svg(330, 172, s, 'Accélérateur : armatures A et B distantes de d = 4 m, champ électrique E dirigé de A vers B, le long de l\'axe x');
  }
  // ex. 9 5.3 : position x(t) d'un proton (x = eU t² / (2md))
  const A9 = 1.6e-19 * 2e6 / (1.67e-27 * 4) / 2;       // x = A9 t² (t en s)
  function figEx9x() {
    return ET.courbes({ tmax: 500, ymin: 0, ymax: 4, pasT: 100, pasY: 1, W: 320, H: 200, nomX: 't (ns)', nomY: 'x (m)',
      series: [{ f: t => A9 * Math.pow(t * 1e-9, 2), coul: '#c2570c' }], aria: 'Position x du proton en fonction du temps : parabole qui part de 0 et atteint 4 m vers 410 ns' });
  }

  /* ============================================================
     LES EXERCICES
     ============================================================ */
  const Fe1 = 3.2e-19 * 5e4, We1 = 3.2e-19 * 5e4 * .10;
  const vmax8 = Math.sqrt(2 * g * 50), Ed8 = .5 * 75 * (2 * g * 50 - 26.5 * 26.5);
  const m9 = 1.67e-27, e9 = 1.6e-19, U9 = 2e6, d9 = 4, F9 = e9 * U9 / d9, P9 = m9 * g, Ec9 = e9 * U9, v9 = Math.sqrt(2 * Ec9 / m9), ts9 = Math.sqrt(d9 / A9);
  const N9 = 50e-9 * 5 * 60 / e9;

  const EXERCICES = [
    /* ---------- Travail d'une force ---------- */
    { id: '1', groupe: 'bases', titre: 'Particules dans un condensateur', desc: 'Force électrique q E⃗ et son travail sur le déplacement de A à B',
      contexte: `<p>Des particules portant une charge q positive pénètrent entre les deux plaques d'un condensateur plan. Il règne à l'intérieur du condensateur un champ électrique uniforme ${V('E')} de valeur 5 × 10<sup>4</sup> V·m<sup>−1</sup>, de direction perpendiculaire aux plaques et de sens de A vers B. La distance entre les plaques est d = 10 cm.</p>${figEx1()}<p class="ph-donnees">Donnée : q = 3,2 × 10<sup>−19</sup> C.</p>`,
      parties: [
        choix(`a) Direction et sens de la force électrique ${V('F', 'E')} = q ${V('E')} :`, [['ok', 'perpendiculaire aux plaques, de A vers B'], ['ba', 'perpendiculaire aux plaques, de B vers A'], ['tg', 'tangente à la trajectoire']], 'ok',
          `<p>q > 0 : ${V('F', 'E')} a la même direction et le même sens que ${V('E')}, perpendiculaire aux plaques, de A vers B, quelle que soit la position (en C aussi).</p>`, { indices: { ba: 'q est positive : la force a le sens du champ.', tg: `${V('F', 'E')} = q ${V('E')} : sa direction est celle du champ, la même en tout point.` } }),
        scient(`a) Valeur de ${V('F', 'E')} :`, 'F<sub>E</sub> =', Fe1, 'N', `${calc(`F<sub>E</sub> = q E = 3,2 × 10<sup>−19</sup> × 5 × 10<sup>4</sup> = ${c_('1,6 × 10<sup>−14</sup> N')}`)}`, { diag: () => 'F<sub>E</sub> = q E.' }),
        scient(`b) Travail de ${V('F', 'E')} pour le déplacement de A à B (en rose) :`, `W<sub>AB</sub>(${V('F', 'E')}) =`, We1, 'J',
          `<p>Formule du cours : W<sub>AB</sub>(${V('F', 'E')}) = q U<sub>AB</sub> = q E d (le travail ne dépend pas du chemin suivi).</p>${calc(`W<sub>AB</sub> = 3,2 × 10<sup>−19</sup> × 5 × 10<sup>4</sup> × 10 × 10<sup>−2</sup> = ${c_('1,6 × 10<sup>−15</sup> J')}`)}`,
          { diag: v => (proche(v, Fe1 * 10, .05) ? 'd en mètres : 10 cm = 0,10 m.' : proche(v, -We1, .05) ? 'La force est dans le sens du déplacement de A vers B : travail moteur.' : 'W = q U = q E d.') })] },
    { id: '2', groupe: 'bases', titre: 'Énergie mécanique (QCM)', desc: 'Expression de E_m en chute libre ; variation de E_pp',
      contexte: `<p>Choisir la (ou les) bonne(s) réponse(s).</p>`,
      parties: [
        choix('1. L\'expression de l\'énergie mécanique d\'un corps en chute libre est :', [['a', 'E<sub>m</sub> = m · g · z<sub>G</sub>'], ['b', 'E<sub>m</sub> = ½ m · v² + ½ m · z<sub>G</sub>²'], ['c', 'E<sub>m</sub> = ½ m · v² + m · g · z<sub>G</sub>'], ['d', 'E<sub>m</sub> = ½ m · v²']], 'c',
          `<p>${EM} = ${EC} + ${EPP} = ½ m v² + m g z<sub>G</sub> : réponse c.</p>`, { indices: { a: 'C\'est seulement E<sub>pp</sub>.', b: 'E<sub>pp</sub> = m g z, pas ½ m z².', d: 'C\'est seulement E<sub>c</sub>.' } }),
        choix('2. L\'énergie potentielle de pesanteur E<sub>pp</sub> d\'un solide de masse m = 8,2 kg dont l\'altitude diminue de 7,0 m :', [['a', 'reste constante'], ['b', 'augmente de 5,6 × 10<sup>2</sup> J'], ['c', 'diminue de 2,0 × 10<sup>2</sup> J'], ['d', 'diminue de 5,6 × 10<sup>2</sup> J']], 'd',
          `${calc(`ΔE<sub>pp</sub> = m g Δz = 8,2 × 9,81 × (−7,0) = −5,6 × 10<sup>2</sup> J`)}<p>E<sub>pp</sub> diminue de 5,6 × 10<sup>2</sup> J : réponse d.</p>`,
          { indices: { a: 'L\'altitude change : E<sub>pp</sub> = m g z change.', b: 'L\'altitude diminue : E<sub>pp</sub> aussi.', c: 'ΔE<sub>pp</sub> = m g Δz : as-tu multiplié par g = 9,81 ?' } })] },
    { id: '3', groupe: 'bases', titre: 'Différents transferts énergétiques', desc: 'Associer un transfert d\'énergie à chaque situation',
      contexte: `<p>Parmi les transferts énergétiques (a) à (d) proposés ci-dessous, quels sont ceux qui peuvent être associés aux situations 1 à 4 ?</p>
        <ol class="er-liste"><li>Dans un flipper, le lanceur met en mouvement la boule.</li><li>Un wagonnet dévale une piste de montagnes russes.</li><li>Une boule de flipper atteint le sommet de la piste.</li><li>Un gymnaste déforme un trampoline.</li></ol>
        <p>(a) Énergie cinétique en énergie potentielle de pesanteur. (b) Énergie cinétique en énergie potentielle élastique. (c) Énergie potentielle de pesanteur en énergie cinétique. (d) Énergie potentielle élastique en énergie cinétique.</p>`,
      parties: [grille('Choisis le transfert de chaque situation :', [['a', '(a)'], ['b', '(b)'], ['c', '(c)'], ['d', '(d)']],
        [{ id: '1', label: '1. Le lanceur du flipper met la boule en mouvement', bonne: 'd', indice: 'Le ressort du lanceur, comprimé, se détend : énergie potentielle élastique → énergie cinétique.' },
          { id: '2', label: '2. Un wagonnet dévale une piste', bonne: 'c', indice: 'Il descend et accélère : énergie potentielle de pesanteur → énergie cinétique.' },
          { id: '3', label: '3. La boule atteint le sommet de la piste', bonne: 'a', indice: 'Elle monte et ralentit : énergie cinétique → énergie potentielle de pesanteur.' },
          { id: '4', label: '4. Un gymnaste déforme un trampoline', bonne: 'b', indice: 'Il ralentit en déformant la toile : énergie cinétique → énergie potentielle élastique.' }],
        '<p>1 : d ; 2 : c ; 3 : a ; 4 : b.</p>')] },
    /* ---------- Théorème de l'énergie cinétique, énergie mécanique ---------- */
    { id: '4', groupe: 'tec', titre: 'Balle lancée vers le haut', desc: 'Théorème de l\'énergie cinétique : altitude maximale, altitude pour une vitesse donnée',
      contexte: `<p>Une balle de masse m = 45,0 g est lancée verticalement vers le haut depuis une hauteur h = 90,0 cm avec une vitesse initiale v<sub>0</sub> = 12,0 ${MS}. On néglige les frottements de l'air ; g = 9,81 ${G}.</p>
        <ol class="er-liste"><li>Calculer l'altitude z<sub>max</sub> atteinte.</li><li>Quelle sera son altitude lorsque sa vitesse sera de 5,0 ${MS} ?</li></ol>`,
      parties: [
        choix('1. Bilan des forces sur la balle après le lancer :', [['p', 'le poids seulement (frottements de l\'air négligés)'], ['pl', 'le poids et la force du lancer'], ['r', 'le poids et les frottements de l\'air']], 'p',
          `<p>${V('P')} = m ${V('g')} ; frottements de l'air négligés ; la main n'agit plus après le lancer.</p>${schemaMvt({ sens: 'haut', objet: 'balle', forces: ['P'], d: 'Δz', angles: true }, { vA: '12,0 ' + MS, vB: '0', d: '?' })}<p>Δz = z<sub>max</sub> − h : altitude gagnée entre A et B.</p>`,
          { indices: { pl: 'Une fois lâchée, la balle n\'est plus en contact avec la main.', r: 'L\'énoncé les néglige.' } }),
        choix('1. Le théorème de l\'énergie cinétique entre A (départ, z = h) et B (sommet, z = z<sub>max</sub>) s\'écrit :', [['ok', '½ m v<sub>B</sub>² − ½ m v<sub>0</sub>² = −m g (z<sub>max</sub> − h)'], ['s', '½ m v<sub>B</sub>² − ½ m v<sub>0</sub>² = m g (z<sub>max</sub> − h)'], ['z', '½ m v<sub>B</sub>² − ½ m v<sub>0</sub>² = −m g z<sub>max</sub>']], 'ok',
          `<p>${TEC}(${V('P')}). La balle monte : le travail du poids est résistant, W<sub>AB</sub>(${V('P')}) = m g × (altitude descendue) = −m g (z<sub>max</sub> − h).</p>`,
          { indices: { s: 'La balle monte : le travail du poids est résistant (négatif).', z: 'Le dénivelé entre A et B est z<sub>max</sub> − h.' } }),
        nombre('1. Avec v<sub>B</sub> = 0 au sommet, calcule z<sub>max</sub> (2 chiffres significatifs) :', 'z<sub>max</sub> =', .9 + 144 / (2 * g), 'm',
          `${calc(`½ m v<sub>0</sub>² = m g (z<sub>max</sub> − h) ⟺ z<sub>max</sub> = h + ${fr('v<sub>0</sub><sup>2</sup>', '2 g')} = 0,90 + ${fr('12,0<sup>2</sup>', '2 × 9,81')} = ${c_('8,2 m')}`)}`,
          { diag: v => (proche(v, 144 / (2 * g), .03) ? 'C\'est la hauteur gagnée : ajoute h = 0,90 m.' : proche(v, 90 + 144 / (2 * g), .03) ? 'h en mètres : 90,0 cm = 0,900 m.' : 'z<sub>max</sub> = h + v<sub>0</sub>² / (2g).') }),
        nombre('2. Altitude z<sub>C</sub> du point C où la vitesse vaut 5,0 ' + MS + ' (2 chiffres significatifs) :', 'z<sub>C</sub> =', .9 + (144 - 25) / (2 * g), 'm',
          `<p>${TEC.replace('A et B', 'A et C')}(${V('P')}) :</p>${calc(`½ m v<sub>C</sub>² − ½ m v<sub>A</sub>² = −m g (z<sub>C</sub> − h) ⟺ z<sub>C</sub> = ${fr('v<sub>A</sub><sup>2</sup> − v<sub>C</sub><sup>2</sup>', '2 g')} + h = ${fr('12,0<sup>2</sup> − 5,0<sup>2</sup>', '2 × 9,81')} + 0,90 = ${c_('7,0 m')}`)}`,
          { diag: v => (proche(v, (144 - 25) / (2 * g), .03) ? 'Ajoute h = 0,90 m.' : proche(v, .9 + 49 / (2 * g), .03) ? 'Ce sont les carrés des vitesses qui se soustraient : 12,0² − 5,0².' : '½ m v<sub>C</sub>² − ½ m v<sub>A</sub>² = −m g (z<sub>C</sub> − h).') })] },
    { id: '5', groupe: 'tec', titre: 'Balle freinée par l\'air', desc: 'Variations d\'énergies, frottements, énergie dissipée',
      contexte: `<p>Une balle de masse m = 45,0 g, lancée verticalement vers le haut depuis le sol (z<sub>0</sub> = 0 m) avec une vitesse initiale v<sub>0</sub> = 12,0 ${MS}, atteint une altitude maximale z<sub>max</sub> = 6,0 m (g = 9,81 ${G}).</p>
        <ol class="er-liste"><li>Calculer la valeur des variations d'énergies qui ont lieu.</li><li>En déduire la présence ou non de frottements.</li><li>Le cas échéant, indiquer la valeur : a. du travail fourni par la force qui modélise l'action des frottements ; b. de l'énergie dissipée au cours du mouvement.</li></ol>`,
      parties: [
        nombre('1. Variation d\'énergie cinétique entre le bas et le haut (3 chiffres significatifs) :', 'ΔE<sub>c</sub> =', -.5 * .045 * 144, 'J',
          calc(`ΔE<sub>c</sub> = E<sub>c haut</sub> − E<sub>c bas</sub> = 0 − ½ m v<sub>0</sub>² = −½ × 45,0 × 10<sup>−3</sup> × 12,0² = ${c_('−3,24 J')}`), { signe: true, rel: .01, diag: v => (proche(v, 3.24, .02) ? 'Final (haut, v = 0) − initial (bas) : négatif.' : proche(Math.abs(v), 3240, .02) ? 'm en kg : 45,0 g = 45,0 × 10<sup>−3</sup> kg.' : 'ΔE<sub>c</sub> = 0 − ½ m v<sub>0</sub>².') }),
        nombre('1. Variation d\'énergie potentielle de pesanteur (3 chiffres significatifs) :', 'ΔE<sub>pp</sub> =', .045 * g * 6, 'J',
          calc(`ΔE<sub>pp</sub> = E<sub>pp haut</sub> − E<sub>pp bas</sub> = m g z<sub>max</sub> − 0 = 45,0 × 10<sup>−3</sup> × 9,81 × 6,0 = ${c_('2,65 J')}`), { signe: true, rel: .01, diag: v => (proche(v, -2.65, .02) ? 'La balle monte : E<sub>pp</sub> augmente.' : 'ΔE<sub>pp</sub> = m g z<sub>max</sub> − 0.') }),
        nombre('1. Variation d\'énergie mécanique (2 chiffres significatifs) :', 'ΔE<sub>m</sub> =', .045 * g * 6 - .5 * .045 * 144, 'J',
          calc(`ΔE<sub>m</sub> = ΔE<sub>c</sub> + ΔE<sub>pp</sub> = −3,24 + 2,65 = ${c_('−0,59 J')}`), { signe: true, rel: .03, diag: () => 'ΔE<sub>m</sub> = ΔE<sub>c</sub> + ΔE<sub>pp</sub>.' }),
        choix('2. Y a-t-il des frottements ?', [['oui', 'oui : E<sub>m</sub> a diminué'], ['non', 'non : E<sub>m</sub> s\'est conservée']], 'oui', '<p>E<sub>m</sub> a perdu 0,59 J : il y a donc des frottements.</p>', { indice: 'Sans frottements, E<sub>m</sub> se conserverait : ΔE<sub>m</sub> = 0.' }),
        nombre(`3. a. Travail W<sub>bas→haut</sub>(${V('f')}) de la force de frottement (2 chiffres significatifs) :`, `W(${V('f')}) =`, .045 * g * 6 - .5 * .045 * 144, 'J',
          `<p>W<sub>bas→haut</sub>(${V('f')}) = ΔE<sub>m</sub> = ${c_('−0,59 J')} (négatif : travail résistant).</p>`, { signe: true, rel: .03, calc: false, diag: v => (v > 0 ? 'Les frottements s\'opposent au mouvement : travail résistant, négatif.' : 'La perte d\'énergie mécanique est le travail des frottements.') }),
        choix('3. b. Énergie dissipée au cours du mouvement :', [['ok', '0,59 J (perdue sous forme d\'énergie thermique)'], ['e', '3,24 J'], ['p', '2,65 J']], 'ok', '<p>L\'énergie dissipée est la perte d\'énergie mécanique : |ΔE<sub>m</sub>| = 0,59 J.</p>',
          { indices: { e: 'C\'est l\'énergie cinétique du départ : une partie s\'est transformée en E<sub>pp</sub>.', p: 'C\'est l\'énergie potentielle gagnée.' } })] },
    { id: '6', groupe: 'tec', titre: 'Effets énergétiques des frottements', desc: 'Oscillateurs en régime périodique et pseudo-périodique',
      contexte: `<p>Les graphiques ci-dessous donnent les variations des énergies cinétique, potentielle élastique et mécanique de systèmes oscillants en régime périodique et pseudo-périodique.</p>
        <p><b>Graphique 1</b></p>${figEx6(1)}<p><b>Graphique 2</b></p>${figEx6(2)}`,
      parties: [
        grille('1. a. Dans chaque cas, quelles formes d\'énergie varient au cours du temps ?', [['cp', 'E<sub>c</sub> et E<sub>p</sub>'], ['cpm', 'E<sub>c</sub>, E<sub>p</sub> et E<sub>m</sub>']],
          [{ id: '1', label: 'Graphique 1', bonne: 'cpm', indice: 'Sur le graphique 1, E<sub>m</sub> diminue de 30 mJ à presque 0.' }, { id: '2', label: 'Graphique 2', bonne: 'cp', indice: 'Sur le graphique 2, E<sub>m</sub> reste à 30 mJ.' }],
          '<p>Graphique 2 : E<sub>c</sub> et E<sub>p</sub> ; graphique 1 : E<sub>c</sub>, E<sub>p</sub> et E<sub>m</sub>.</p>'),
        grille('1. b. Transferts énergétiques mis en jeu :', [['ech', 'échanges entre E<sub>c</sub> et E<sub>p</sub>'], ['ech2', 'échanges entre E<sub>c</sub> et E<sub>p</sub>, et énergie mécanique perdue par frottements']],
          [{ id: '1', label: 'Graphique 1', bonne: 'ech2' }, { id: '2', label: 'Graphique 2', bonne: 'ech' }],
          '<p>Cas 2 : transferts entre E<sub>c</sub> et E<sub>p</sub>. Cas 1 : les mêmes, et un transfert d\'énergie mécanique vers l\'énergie de frottements (pertes par frottements).</p>', { diag: () => 'Regarde si E<sub>m</sub> reste constante.' }),
        nombre('1. c. Quantité d\'énergie dissipée dans le cas 1 au bout de 2 s :', 'E<sub>dissipée</sub> =', 30, 'mJ', '<p>Dans le cas 1, toute l\'énergie mécanique finit par être dissipée : 30 mJ au bout de 2 s (rien dans le cas 2).</p>',
          { tol: 1.5, calc: false, diag: () => 'Lis E<sub>m</sub> au début et à la fin du graphique 1.' }),
        choix('2. Quelle est la cause des différences constatées ?', [['ok', 'des frottements dans le cas 1, pas dans le cas 2'], ['m', 'une masse différente'], ['t', 'une durée d\'observation différente']], 'ok', '<p>Cas 1 : il y a des frottements ; cas 2 : il n\'y en a pas.</p>', { indice: 'Qu\'est-ce qui fait diminuer l\'énergie mécanique ?' }),
        grille('3. Associe le nom d\'un régime à chaque graphique :', [['per', 'périodique'], ['pseudo', 'pseudo-périodique']],
          [{ id: '1', label: 'Graphique 1', bonne: 'pseudo' }, { id: '2', label: 'Graphique 2', bonne: 'per' }],
          '<p>1 : régime pseudo-périodique (les oscillations s\'amortissent) ; 2 : régime périodique.</p>', { diag: () => 'Des oscillations qui s\'amortissent : régime pseudo-périodique.' })] },
    { id: '7', groupe: 'tec', titre: 'Ballon de rugby', desc: 'Lire un graphique d\'énergies : vrai ou faux, corriger',
      contexte: `<p>Le graphique ci-dessous montre les variations des énergies cinétique E<sub>c</sub>, potentielle de pesanteur E<sub>pp</sub> et mécanique E<sub>m</sub> d'un ballon de rugby lors d'une transformation.</p>${figEx7()}
        <ol class="er-liste"><li>À t = 0 s, E<sub>c</sub> est nulle, E<sub>pp</sub> est maximale et égale à E<sub>m</sub>.</li><li>À t = t<sub>1</sub> et t = t<sub>3</sub>, E<sub>c</sub> = E<sub>pp</sub> = (1/2) E<sub>m</sub>.</li>
          <li>À t = t<sub>2</sub>, E<sub>c</sub> est nulle, E<sub>pp</sub> est maximale et E<sub>m</sub> est égale à E<sub>pp</sub>.</li><li>À la fin du mouvement, E<sub>c</sub> = E<sub>m</sub> car E<sub>pp</sub> = 0 J.</li>
          <li>Au cours du mouvement, ΔE<sub>m</sub> < 0 : il y a dissipation d'énergie car le travail de la force qui modélise l'action des frottements est non négligeable.</li>
          <li>Entre t = 0 s et t = t<sub>2</sub>, ΔE<sub>c</sub> < 0, ΔE<sub>pp</sub> > 0 et ΔE<sub>c</sub> + ΔE<sub>pp</sub> = 0.</li><li>Au cours du mouvement, ΔE<sub>c</sub> = ΔE<sub>pp</sub> = 0.</li>
          <li>Il y a un transfert d'énergie potentielle en énergie cinétique entre t = 0 s et t = t<sub>2</sub>, puis d'énergie cinétique en énergie potentielle.</li></ol>`,
      parties: [
        grille('Indique si chaque affirmation est vraie ou fausse :', [['v', 'vraie'], ['f', 'fausse']],
          [{ id: '1', label: 'Affirmation 1', bonne: 'f', apres: '<p>Corrigée : à t = 0 s, E<sub>pp</sub> est nulle, E<sub>c</sub> est maximale et égale à E<sub>m</sub> (inverser E<sub>c</sub> et E<sub>pp</sub>).</p>' },
            { id: '2', label: 'Affirmation 2', bonne: 'v' },
            { id: '3', label: 'Affirmation 3', bonne: 'f', apres: '<p>Corrigée : à t<sub>2</sub>, E<sub>c</sub> est minimale (pas nulle), E<sub>pp</sub> est maximale et E<sub>m</sub> = E<sub>pp</sub> + E<sub>c</sub>.</p>' },
            { id: '4', label: 'Affirmation 4', bonne: 'v' },
            { id: '5', label: 'Affirmation 5', bonne: 'f', apres: '<p>Corrigée : ΔE<sub>m</sub> = 0 : il n\'y a pas de dissipation d\'énergie, car le travail de la force de frottements est négligeable.</p>' },
            { id: '6', label: 'Affirmation 6', bonne: 'v' },
            { id: '7', label: 'Affirmation 7', bonne: 'v' },
            { id: '8', label: 'Affirmation 8', bonne: 'f', apres: '<p>Corrigée : transfert d\'énergie cinétique en énergie potentielle entre 0 et t<sub>2</sub>, puis d\'énergie potentielle en énergie cinétique (inverser potentielle et cinétique).</p>' }],
          '<p>Vraies : 2, 4, 6, 7. Fausses : 1, 3, 5, 8 (corrections ci-dessus).</p>', { diag: () => 'E<sub>m</sub> est la droite horizontale ; E<sub>pp</sub> part de 0 et passe par un maximum à t<sub>2</sub> ; E<sub>c</sub> part de E<sub>m</sub> et passe par un minimum non nul à t<sub>2</sub>.' })] },
    { id: '8', groupe: 'tec', titre: 'Tremplin de saut à ski', desc: 'Vitesse maximale théorique, énergie dissipée par frottements',
      contexte: `<p>Un tremplin de saut à ski présentant un dénivelé h = 50,0 m permet à un sauteur (de masse m = 75,0 kg) d'atteindre une vitesse d'envol v<sub>G</sub> = 26,5 ${MS} (g = 9,81 ${G}).</p>${figPente({ A: 'A', B: 'B (envol)', vB: 'max', aria: 'Tremplin : le sauteur part de A sans vitesse et descend d\'un dénivelé h jusqu\'au point d\'envol B' })}
        <ol class="er-liste"><li>a. Exprimer la vitesse maximale théorique v<sub>max</sub> d'envol en fonction des données de l'énoncé, puis calculer sa valeur. b. Commenter le résultat en termes de transferts d'énergie.</li><li>a. Déterminer la valeur de l'énergie dissipée. b. Quelle en est la cause et comment réduire sa valeur ?</li></ol>`,
      parties: [
        choix('1. a. La vitesse est maximale si les frottements sont négligeables. Le sauteur subit alors :', [['ok', `son poids ${V('P')} et la réaction normale ${V('R')} de la piste`], ['p', `son poids ${V('P')} seulement`], ['f', `son poids, la réaction et les frottements`]], 'ok',
          `<p>Bilan des forces : ${V('P')} et ${V('R')} (réaction normale du sol), frottements négligés. W<sub>AB</sub>(${V('R')}) = 0 car ${V('R')} ⊥ à la trajectoire.</p>`, { indices: { p: 'Il est en contact avec la piste.', f: 'On cherche la vitesse maximale : frottements négligés.' } }),
        choix('1. a. Expression de v<sub>max</sub> :', [['ok', `v<sub>max</sub> = ${rac('2 g h')}`], ['h', `v<sub>max</sub> = ${rac('g h')}`], ['m', `v<sub>max</sub> = ${rac('2 m g h')}`]], 'ok',
          `<p>Méthode 1 : ${TEC}(${V('P')}) + W<sub>AB</sub>(${V('R')}), avec W<sub>AB</sub>(${V('R')}) = 0 : ½ m v<sub>max</sub>² − 0 = m g h (poids moteur), donc v<sub>max</sub> = ${rac('2 g h')}.</p><p>Méthode 2 : conservation de E<sub>m</sub> : l'énergie cinétique à l'envol est égale à l'énergie potentielle de pesanteur perdue sur la hauteur h : ½ m v<sub>max</sub>² = m g h.</p>`,
          { indices: { h: '½ m v² = m g h donne v² = 2 g h.', m: 'La masse se simplifie.' } }),
        nombre('1. a. Valeur de v<sub>max</sub> (3 chiffres significatifs) :', 'v<sub>max</sub> =', vmax8, MS, calc(`v<sub>max</sub> = ${rac('2 × 9,81 × 50,0')} = ${c_('31,3 ' + MS)}`),
          { rel: .005, diag: v => (proche(v, vmax8 * vmax8, .02) ? 'Prends la racine.' : `v<sub>max</sub> = ${rac('2 g h')}.`) }),
        choix('1. b. La vitesse réelle (26,5 ' + MS + ') est inférieure : cela s\'explique par…', [['ok', 'une perte d\'énergie par frottements'], ['g', 'une valeur de g plus faible'], ['m', 'la masse du sauteur']], 'ok', '<p>Sa vitesse réelle est inférieure : une partie de l\'énergie a été perdue par frottements.</p>', { indices: { g: 'g = 9,81 ' + G + ' sur Terre.', m: 'La masse se simplifie dans v<sub>max</sub>.' } }),
        scient('2. a. Énergie dissipée (3 chiffres significatifs) :', 'E<sub>diss</sub> =', 1.04e4, 'J',
          `<p>L'énergie dissipée est la différence entre l'énergie cinétique maximale qu'il aurait et son énergie cinétique réelle :</p>${calc(`E<sub>diss</sub> = ½ m v<sub>max</sub>² − ½ m v<sub>G</sub>² = ½ m (v<sub>max</sub>² − v<sub>G</sub>²) = ½ × 75,0 × (31,3² − 26,5²) = ${c_('1,04 × 10<sup>4</sup> J')}`)}<p>(1,05 × 10<sup>4</sup> J sans arrondir v<sub>max</sub>.)</p>`,
          { cs: 3, rel: .015, diag: v => (proche(v, .5 * 75 * Math.pow(vmax8 - 26.5, 2), .05) ? 'Ce sont les carrés qui se soustraient : v<sub>max</sub>² − v<sub>G</sub>², pas (v<sub>max</sub> − v<sub>G</sub>)².' : 'E<sub>diss</sub> = ½ m (v<sub>max</sub>² − v<sub>G</sub>²).') }),
        choix('2. b. Cause de cette énergie dissipée, et comment la réduire :', [['ok', 'frottements de la neige et de l\'air : farter les skis, prendre une position plus aérodynamique'], ['g', 'le poids : choisir un sauteur plus léger'], ['h', 'le dénivelé : allonger le tremplin']], 'ok',
          '<p>Elle est due aux frottements de la neige et de l\'air. On peut la réduire en améliorant la glisse des skis (fartage) et en améliorant sa position (plus aérodynamique).</p>', { indices: { g: 'Le poids est une force conservative : son travail est déjà dans E<sub>pp</sub>.', h: 'Le dénivelé fixe v<sub>max</sub>, pas les pertes.' } })] },
    /* ---------- Pour aller plus loin ---------- */
    { id: '9', groupe: 'loin', titre: 'Un accélérateur au service de l\'art', desc: 'AGLAÉ : force électrique, théorème de l\'énergie cinétique, méthode PIXE (questions complexes)',
      contexte: `<p>Depuis décembre 1987, un accélérateur de particules baptisé AGLAÉ est installé au centre de recherche et de restauration des musées de France pour identifier les pigments recouvrant les œuvres.</p>
        <p class="ph-donnees">Données : 1 eV = 1,60 × 10<sup>−19</sup> J ; masse du proton m = 1,67 × 10<sup>−27</sup> kg ; charge du proton e = 1,60 × 10<sup>−19</sup> C ; constante d'Avogadro N<sub>A</sub> = 6,02 × 10<sup>23</sup> mol<sup>−1</sup> ; g = 9,81 ${G}.</p>
        <p><b>Principe simplifié de l'accélérateur.</b> Dans l'accélérateur AGLAÉ, une tension U = 2 MV est appliquée entre deux armatures A et B séparées par une distance d = 4 m. Cette tension génère un champ électrique ${V('E')} uniforme de norme E = U / d. Lorsque des protons pénètrent (à vitesse pratiquement nulle) dans ce champ, ils sont soumis à la force électrique et sont accélérés.</p>${figEx9()}
        <p><b>La méthode PIXE</b> (Particle Induced X-ray Emission, émission de rayons X induite par des particules chargées) est la principale méthode utilisée pour étudier la composition des matériaux. Lorsqu'un proton du faisceau d'AGLAÉ bombarde un atome de l'objet à étudier, cet atome peut passer dans un état excité et émet alors des rayons X pour libérer son excès d'énergie. Chaque élément chimique peut être identifié par des valeurs d'énergie de rayons X émis qui lui sont propres.</p>
        <p>Pour ne pas endommager les œuvres, le faisceau de protons doit respecter certaines conditions. D'une part, l'énergie cinétique de chaque proton doit être comprise entre 1,4 et 4 MeV. D'autre part, le nombre de protons frappant la cible chaque seconde doit être adapté au matériau étudié. Ainsi, l'intensité du courant de protons ne doit pas dépasser quelques centaines de picoampères pour les matériaux fragiles tels que le papier, mais peut atteindre 50 nanoampères pour les métaux.</p>
        <p class="er-petit">D'après Philippe Walter, <i>Aglaé, ou la Beauté vue par la Science</i>, Fondation de la maison de la chimie, 2010 ; adapté du sujet de bac Nouvelle-Calédonie, 2016.</p>`,
      parties: [
        scient(`1. Exprimer la force électrique ${V('F')} s'exerçant sur un proton dans l'accélérateur et calculer sa norme :`, 'F =', F9, 'N',
          `<p>${V('F')} = e ${V('E')} et F = e ${fr('U', 'd')} :</p>${calc(`F = 1,60 × 10<sup>−19</sup> × ${fr('2 × 10<sup>6</sup>', '4')} = ${c_('8,0 × 10<sup>−14</sup> N')}`)}`, { diag: v => (proche(v, e9 * U9, .05) ? 'E = U / d : divise par d = 4 m.' : 'F = e E = e U / d.') }),
        scient('2. Calcule le poids du proton :', 'P =', P9, 'N', calc(`P = m g = 1,67 × 10<sup>−27</sup> × 9,81 = ${c_('1,64 × 10<sup>−26</sup> N')}`), { cs: 3, diag: () => 'P = m g.' }),
        choix('2. Peut-on négliger le poids du proton devant la force électrique ?', [['ok', 'oui : F / P ≈ 5 × 10<sup>12</sup>, P est négligeable'], ['non', 'non : il faut en tenir compte']], 'ok', calc(`${fr('F', 'P')} = ${fr('8,0 × 10<sup>−14</sup>', '1,64 × 10<sup>−26</sup>')} = 4,9 × 10<sup>12</sup> ≫ 1 : P est bien négligeable devant F.`), { indice: 'Calcule F / P.' }),
        choix('3. Pour qu\'un proton soit accéléré de l\'armature A vers l\'armature B, quelle armature doit être reliée à la borne positive du générateur ?', [['A', 'l\'armature A'], ['B', 'l\'armature B']], 'A', '<p>Le proton est positif : il est repoussé par l\'armature positive. L\'armature à relier à la borne positive est A.</p>', { indice: 'Le proton, positif, est repoussé par l\'armature +.' }),
        complexe({ q: '4.1. En utilisant le théorème de l\'énergie cinétique, montre qu\'une tension de 2 MV permet à chaque proton d\'atteindre une énergie cinétique adaptée à la méthode PIXE : donne E<sub>c</sub>(B) en MeV.', label: 'E<sub>c</sub>(B) =', unite: 'MeV', valeur: 2, rel: .02, affiche: '2,0',
          reflexe: 'Applique le théorème de l\'énergie cinétique entre A et B (le poids est négligeable, le proton part pratiquement sans vitesse), avec W = q U.',
          diag: v => (proche(v, 3.2e-13, .05) ? 'C\'est E<sub>c</sub>(B) en joules : convertis en eV (÷ 1,60 × 10<sup>−19</sup>), puis en MeV.' : proche(v, 2e6, .05) ? 'C\'est en eV : 1 MeV = 10<sup>6</sup> eV.' : 'E<sub>c</sub>(B) − E<sub>c</sub>(A) = W<sub>AB</sub>(F) = e U, avec E<sub>c</sub>(A) = 0.'),
          correction: `<p>D'après le théorème de l'énergie cinétique, pour le proton, entre l'entrée A et la sortie B : Δ<sub>AB</sub>E<sub>c</sub> = W<sub>AB</sub>(${V('F')}) car ${V('P')} est négligeable.</p>${calc('E<sub>c</sub>(B) − E<sub>c</sub>(A) = e U, avec E<sub>c</sub>(A) = 0 car v(A) = 0 (méthode : W = q × U, > 0 si moteur, ici moteur)')}
            ${calc(`E<sub>c</sub>(B) = e U = 1,60 × 10<sup>−19</sup> × 2 × 10<sup>6</sup> = 3,2 × 10<sup>−13</sup> J = ${fr('3,2 × 10<sup>−13</sup>', '1,60 × 10<sup>−19</sup>')} eV = 2,0 × 10<sup>6</sup> eV = ${c_('2,0 MeV')}`)}<p>Elle est comprise entre 1,4 et 4 MeV : cette énergie cinétique est bien adaptée.</p>`,
          etapes: [
            choix('Étape 1 : le théorème de l\'énergie cinétique entre A et B s\'écrit :', [['ok', 'E<sub>c</sub>(B) − 0 = e U'], ['m', 'E<sub>c</sub>(B) − 0 = −e U'], ['d', 'E<sub>c</sub>(B) − 0 = e U d']], 'ok', '<p>Le proton part sans vitesse ; la force électrique est motrice : W = +e U.</p>', { indices: { m: 'Le proton est accéléré : travail moteur, positif.', d: 'W = q U : la distance est déjà dans U = E d.' } }),
            scient('Étape 2 : calcule E<sub>c</sub>(B) en joules :', 'E<sub>c</sub>(B) =', Ec9, 'J', calc('E<sub>c</sub>(B) = 1,60 × 10<sup>−19</sup> × 2 × 10<sup>6</sup> = 3,2 × 10<sup>−13</sup> J'), { diag: () => 'E<sub>c</sub>(B) = e U.' }),
            nombre('Étape 3 : convertis en MeV (1 eV = 1,60 × 10<sup>−19</sup> J ; 1 MeV = 10<sup>6</sup> eV) :', 'E<sub>c</sub>(B) =', 2, 'MeV', calc('3,2 × 10<sup>−13</sup> / 1,60 × 10<sup>−19</sup> = 2,0 × 10<sup>6</sup> eV = 2,0 MeV, entre 1,4 et 4 MeV : adaptée.'), { diag: v => (proche(v, 2e6, .05) ? 'C\'est en eV.' : 'Divise par 1,60 × 10<sup>−19</sup>.') }),
          ] }),
        scient('4.2. Calcule la valeur de la vitesse atteinte par le proton à la sortie de l\'accélérateur (3 chiffres significatifs) :', 'v<sub>B</sub> =', v9, MS,
          `${calc(`E<sub>c</sub>(B) = ½ m v<sub>B</sub>² ⟺ v<sub>B</sub> = ${rac(fr('2 E<sub>c</sub>(B)', 'm'))} = ${rac(fr('2 × 3,2 × 10<sup>−13</sup>', '1,67 × 10<sup>−27</sup>'))} = ${c_('1,96 × 10<sup>7</sup> ' + MS)}`)}`,
          { cs: 3, rel: .01, diag: v => (proche(v, v9 * v9, .05) ? 'Prends la racine.' : proche(v, v9 / Math.SQRT2, .03) ? `v = ${rac(fr('2 E<sub>c</sub>', 'm'))} : le 2.` : `v<sub>B</sub> = ${rac(fr('2 E<sub>c</sub>(B)', 'm'))}.`) }),
        choix('5.1. Avec la deuxième loi de Newton, la coordonnée de l\'accélération d\'un proton sur l\'axe x est :', [['ok', `a<sub>x</sub> = ${fr('e U', 'm d')}`], ['u', `a<sub>x</sub> = ${fr('e U', 'm')}`], ['g', 'a<sub>x</sub> = −g']], 'ok',
          `<p>Dans le référentiel terrestre supposé galiléen, pour le proton de masse constante, m ${V('a')} = Σ ${V('F', 'ext')} = ${V('F')} (${V('P')} négligé), donc ${V('a')} = ${fr(V('F'), 'm')} = ${fr(`e ${V('E')}`, 'm')}. En projetant sur l'axe x : a<sub>x</sub> = ${fr('e E', 'm')} = ${fr('e U', 'm d')} car E = U / d.</p>`, { indices: { u: 'E = U / d.', g: 'Le poids est négligé.' } }),
        choix('5.2. Équations horaires (origine du repère à l\'entrée, vitesse initiale nulle) :', [['ok', `v<sub>x</sub>(t) = ${fr('e U', 'm d')} t ; x(t) = ${fr('e U', '2 m d')} t<sup>2</sup>`], ['c', `v<sub>x</sub>(t) = ${fr('e U', 'm d')} t ; x(t) = ${fr('e U', 'm d')} t<sup>2</sup>`], ['d', `v<sub>x</sub>(t) = ${fr('e U', 'm d')} ; x(t) = ${fr('e U', 'm d')} t`]], 'ok',
          `<p>En intégrant : v<sub>x</sub>(t) = ${fr('e U', 'm d')} t + v<sub>x</sub>(0), avec v<sub>x</sub>(0) = 0 (« pénètrent à vitesse pratiquement nulle ») ; x(t) = ${fr('e U', '2 m d')} t<sup>2</sup> + x(0), avec x(0) = 0 (origine à l'entrée).</p>`, { indices: { c: 'Primitive de t : t² / 2.', d: 'On intègre l\'accélération, constante.' } }),
        scient('5.2. À la sortie, x(t<sub>s</sub>) = d : retrouve la vitesse de sortie v<sub>x</sub>(t<sub>s</sub>) (3 chiffres significatifs) :', 'v<sub>x</sub>(t<sub>s</sub>) =', v9, MS,
          `${calc(`x(t<sub>s</sub>) = d ⟺ ${fr('e U', '2 m d')} t<sub>s</sub><sup>2</sup> = d ⟺ t<sub>s</sub> = ${rac(fr('2 m', 'e U'))} × d`)}${calc(`v<sub>x</sub>(t<sub>s</sub>) = ${fr('e U', 'm d')} ${rac(fr('2 m', 'e U'))} d = ${rac(fr('2 e U', 'm'))} = ${rac(fr('2 × 1,60 × 10<sup>−19</sup> × 2 × 10<sup>6</sup>', '1,67 × 10<sup>−27</sup>'))} = ${c_('1,96 × 10<sup>7</sup> ' + MS)}`)}<p>On retrouve bien la même vitesse de sortie.</p>`,
          { cs: 3, rel: .01, diag: () => 'Isole t<sub>s</sub> dans x(t<sub>s</sub>) = d, puis remplace dans v<sub>x</sub>(t).' }),
        scient('5.3. Avec la courbe x(t) ci-dessous, retrouve la vitesse de sortie : trace la tangente au point de sortie (x = 4,0 m) et mesure son coefficient directeur.', 'v<sub>B</sub> ≈', v9, MS,
          `<p>Sur le graphique, la sortie correspond à x = 4,0 m. La tangente en ce point coupe l'axe des temps environ 200 ns plus tôt : Δx = 4,0 m pour Δt ≈ 200 ns.</p>${calc(`v<sub>B</sub> = ${fr('Δx', 'Δt')} = ${fr('4,0', '200 × 10<sup>−9</sup>')} = ${c_('2,0 × 10<sup>7</sup> ' + MS)}`)}<p>On retrouve bien une valeur proche de la précédente (1,96 × 10<sup>7</sup> ${MS}).</p>`,
          { rel: .08, calc: false, figure: z => { z.innerHTML = figEx9x(); }, diag: v => (proche(v, 4 / 410e-9, .1) ? 'C\'est la vitesse moyenne (x / t) : il faut la pente de la <b>tangente</b> au point de sortie.' : 'Coefficient directeur de la tangente : Δx / Δt, avec Δt en secondes (1 ns = 10<sup>−9</sup> s).') }),
        complexe({ q: '6. Évalue l\'ordre de grandeur du nombre de protons nécessaires pour l\'étude d\'un métal par la méthode PIXE, sachant qu\'AGLAÉ fonctionne quelques minutes. Exprime ce résultat en moles.', label: 'n ≈', unite: 'mol', valeur: 1e-10, affiche: '1 × 10⁻¹⁰',
          juste: v => v > 0 && Math.abs(Math.log10(v) + 10) <= .7,
          reflexe: 'Commence par le courant de protons pour un métal (50 nA) : l\'intensité est un débit de charges, I = Q / Δt. Choisis une durée de quelques minutes (par exemple 5 min).',
          diag: v => (Math.abs(Math.log10(Math.abs(v) || 1) - 14) <= .7 ? 'C\'est le nombre de protons : divise par N<sub>A</sub> pour l\'avoir en moles.' : 'Q = I Δt, puis le nombre de protons N = Q / e, puis n = N / N<sub>A</sub>.'),
          correction: `<p>Pour étudier un métal, il faut une intensité du courant de protons de 50 nA = 50 × 10<sup>−9</sup> A. L'intensité correspond au débit de charges : I = Q / Δt, avec Q la charge portée par les protons accélérés pendant la durée Δt. Pour un fonctionnement de quelques minutes, on prend Δt = 5 min = 5 × 60 s.</p>
            ${calc('Q = I Δt = 50 × 10<sup>−9</sup> × 5 × 60 = 1,5 × 10<sup>−5</sup> C')}${calc(`N<sub>p</sub> × e = Q ⟺ N<sub>p</sub> = ${fr('Q', 'e')} = ${fr('1,5 × 10<sup>−5</sup>', '1,60 × 10<sup>−19</sup>')} = 9,4 × 10<sup>13</sup> protons`)}
            <p>Soit un ordre de grandeur de 10<sup>14</sup> protons. En moles : ${fr('10<sup>14</sup>', '6,02 × 10<sup>23</sup>')} ≈ ${c_('10<sup>−10</sup> mol')}.</p>`,
          etapes: [
            scient('Étape 1 : charge Q transportée en Δt = 5 min, avec I = 50 nA (Q = I Δt) :', 'Q =', 50e-9 * 300, 'C', calc('Q = 50 × 10<sup>−9</sup> × 5 × 60 = 1,5 × 10<sup>−5</sup> C'), { diag: v => (proche(v, 50e-9 * 5, .05) ? 'Δt en secondes : 5 min = 300 s.' : 'Q = I × Δt, I en A, Δt en s.') }),
            scient('Étape 2 : nombre de protons N<sub>p</sub> = Q / e :', 'N<sub>p</sub> =', N9, 'protons', calc('N<sub>p</sub> = 1,5 × 10<sup>−5</sup> / 1,60 × 10<sup>−19</sup> = 9,4 × 10<sup>13</sup>, ordre de grandeur 10<sup>14</sup>'), { diag: () => 'Chaque proton porte la charge e.' }),
            scient('Étape 3 : en moles, n = N<sub>p</sub> / N<sub>A</sub> :', 'n =', N9 / 6.02e23, 'mol', calc('n = 9,4 × 10<sup>13</sup> / 6,02 × 10<sup>23</sup> = 1,6 × 10<sup>−10</sup> mol, ordre de grandeur 10<sup>−10</sup> mol'), { diag: () => 'Divise par la constante d\'Avogadro.' }),
          ] })] },
  ];

  ET.GROUPES_EX = [{ id: 'bases', titre: 'Travail, énergie mécanique et transferts (exercices 1 à 3)' }, { id: 'tec', titre: 'Théorème de l\'énergie cinétique, énergie mécanique et frottements (exercices 4 à 8)' }, { id: 'loin', titre: 'Pour aller plus loin (exercice 9)' }];
  ET.EXERCICES = EXERCICES;
  void ENCRE3; void sci; void ts9;
})();
