/* ============================================================
   Exercices du module 5 (application « Forces et mouvement : lois de
   Newton ») : les exercices 1 à 20 de la feuille, même ordre, même
   numérotation.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] ou une fonction qui les fabrique (bilans des forces :
   chaque essai repart de zéro) } ; chaque partie suit le format de
   BF.PARTIES (bilan-forces/modules/bf.js) avec p.q (question) et
   p.correction (correction détaillée).
   Ex. 1 à 4 : bilans des forces avec l'outil de l'application « Bilan
   des forces » (BF.bilan, situations de bilan-forces/modules/situations.js).
   Ex. 20 (sujet de bac) : question complexe (détermination de Cx)
   proposée telle quelle, puis par étapes sur demande (« Je ne sais pas
   par où commencer »), voir LN.complexe dans ce fichier.

   Valeurs vérifiées par un script. Écarts avec les corrections :
     ex. 9 : a = 450 / 80 = 5,625 m·s⁻², écrit 5,6 m·s⁻² (2 chiffres
       significatifs, comme m = 80 kg) ; ③ : 1,25 → 1,3 m·s⁻² ;
     ex. 12 : l'énoncé ne donne pas g ; la correction prend g = 10 N·kg⁻¹,
       on l'écrit dans l'énoncé ;
     ex. 20 : la correction calcule Cx avec g = 9,81 alors que l'énoncé
       donne g = 9,80 m·s⁻² (Cx = 5,5 × 10⁻² dans les deux cas) ; elle
       conclut « z = 1 < 2 » alors que le critère de l'énoncé est z ≤ 3 ;
       elle ne donne pas la vitesse en km/h (11 m·s⁻¹ ≈ 40 km/h).
   ============================================================ */
(function () {
  'use strict';
  const BF = window.BF, LN = window.LN;
  const { o, fmt, cs, sci, bilan, SITUATIONS: S, COUL } = BF;
  const { V, SF, SFX, NUL, fl, nom, svg, txt, chrono } = LN;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c = h => `<span class="c">${h}</span>`;
  const MS2 = 'm·s<sup>−2</sup>', MS = 'm·s<sup>−1</sup>';
  const rad = d => d * Math.PI / 180;
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options: options.map(x => o(x[0], x[1])), bonne, correction, melanger: false, colonne: options.some(x => x[1].replace(/<[^>]+>/g, '').length > 24) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .02 }, opts);
  const gabarit = (q, label, morceaux, correction, opts) => Object.assign({ type: 'gabarit', q, label, morceaux, correction }, opts);
  const REDAC = (ref, sys) => `Dans le référentiel ${ref} supposé galiléen, d'après la deuxième loi de Newton pour ${sys} de masse constante, ${SFX} = m ${V('a')}.`;

  /* ---------- bilans des forces (ex. 1 à 4) ---------- */
  // les parties de plusieurs bilans à la suite ; la première partie de chaque situation montre son dessin
  function bilans(liste, jusqua) {
    const res = [];
    liste.forEach(([s, lettre]) => {
      const b = bilan(s, { jusqua: jusqua || 'noms' });
      b.parties.forEach((p, k) => {
        p.correction = p.solution;
        if (k === 0) p.q = `<div class="ln-ex-sit"><p class="er-q-nom">${lettre}${s.titre}</p>${b.enonce}</div>${p.q}`;
        res.push(p);
      });
    });
    return res;
  }

  /* ---------- figures ---------- */
  const E = LN.ENCRE, E2 = LN.ENCRE2;
  // ex. 5 : vecteurs dans un repère quadrillé (1 carreau = la longueur de i⃗)
  const FIG5 = (() => {
    const u = 26, X = x => 50 + x * u, Y = y => 110 - y * u;
    let s = '';
    for (let x = 0; x <= 8; x++) s += `<line x1="${X(x)}" y1="${Y(-3)}" x2="${X(x)}" y2="${Y(4)}" stroke="#dcd7e8"/>`;
    for (let y = -3; y <= 4; y++) s += `<line x1="${X(0)}" y1="${Y(y)}" x2="${X(8)}" y2="${Y(y)}" stroke="#dcd7e8"/>`;
    s += fl(X(0), Y(0), X(8.4), Y(0), E, { ep: 1.4, lt: 8 }) + fl(X(0), Y(-3), X(0), Y(4.4), E, { ep: 1.4, lt: 8 }) + txt(X(8.4), Y(0) + 16, 'x', { g: 800, c: E }) + txt(X(0) - 14, Y(4.2), 'y', { g: 800, c: E }) + txt(X(0) - 14, Y(0) + 14, 'O');
    s += fl(X(0), Y(0), X(5), Y(3), '#1098ad', { ep: 2.6 }) + nom(X(5) + 8, Y(3) - 6, 'T', '', '#1098ad');
    s += fl(X(0), Y(0), X(0), Y(2), '#862e9c', { ep: 2.6 }) + nom(X(0) - 18, Y(2) + 6, 'R', '', '#862e9c');
    s += fl(X(0), Y(0), X(0), Y(-2), COUL.P, { ep: 2.6 }) + nom(X(0) - 18, Y(-2) + 4, 'P', '', COUL.P);
    s += fl(X(0), Y(0), X(1), Y(0), '#5c940d', { ep: 2.2, lt: 8 }) + nom(X(.6), Y(0) + 20, 'i', '', '#5c940d', { t: 13 });
    s += fl(X(0), Y(0), X(0), Y(1), '#5c940d', { ep: 2.2, lt: 8 }) + nom(X(0) + 12, Y(.7), 'j', '', '#5c940d', { t: 13 });
    return svg(300, 200, s, 'Repère quadrillé : T va de O à 5 carreaux à droite et 3 vers le haut ; R : 2 carreaux vers le haut ; P : 2 carreaux vers le bas');
  })();
  // ex. 6 : vecteur v⃗₀ et ses angles (α avec Ox, β avec Oy)
  function fig6(angle) {
    const O = [40, 120], L = 150, a = rad(32), X = O[0] + L * Math.cos(a), Y = O[1] - L * Math.sin(a);
    let s = fl(O[0], O[1], 270, O[1], E, { ep: 1.4, lt: 8 }) + fl(O[0], O[1], O[0], 12, E, { ep: 1.4, lt: 8 }) + txt(266, O[1] + 16, 'x', { g: 800, c: E }) + txt(O[0] - 14, 22, 'y', { g: 800, c: E }) + txt(O[0] - 14, O[1] + 14, 'O');
    s += `<line x1="${X}" y1="${Y}" x2="${X}" y2="${O[1]}" stroke="#8d8f94" stroke-dasharray="4 3"/><line x1="${X}" y1="${Y}" x2="${O[0]}" y2="${Y}" stroke="#8d8f94" stroke-dasharray="4 3"/>`;
    s += fl(O[0], O[1], X, Y, '#1971c2', { ep: 2.6 }) + nom(X - 4, Y - 10, 'v', '0', '#1971c2');
    s += angle === 'a' ? `<path d="M${O[0] + 40},${O[1]} A40,40 0 0 0 ${O[0] + 40 * Math.cos(a)},${O[1] - 40 * Math.sin(a)}" fill="none" stroke="#5a3fc4" stroke-width="1.6"/>` + txt(O[0] + 46, O[1] - 8, 'α', { g: 800, c: '#5a3fc4', t: 14 })
      : `<path d="M${O[0]},${O[1] - 40} A40,40 0 0 1 ${O[0] + 40 * Math.cos(a)},${O[1] - 40 * Math.sin(a)}" fill="none" stroke="#5a3fc4" stroke-width="1.6"/>` + txt(O[0] + 12, O[1] - 46, 'β', { g: 800, c: '#5a3fc4', t: 14 });
    return svg(290, 140, s, angle === 'a' ? 'Vecteur v0 faisant l\'angle alpha avec l\'axe x' : 'Vecteur v0 faisant l\'angle bêta avec l\'axe y');
  }
  // ex. 7 : plaques homogènes
  const FIG7 = svg(340, 110, `<path d="M20,90 L70,10 L120,90 Z" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><circle cx="70" cy="63" r="3" fill="${E}"/>` + txt(76, 62, 'A', { g: 800, c: E }) +
    `<rect x="140" y="30" width="80" height="50" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><circle cx="180" cy="55" r="3" fill="${E}"/>` + txt(186, 54, 'B', { g: 800, c: E }) +
    `<path d="M240,20 L280,60 L320,20 L320,38 L280,78 L240,38 Z" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><circle cx="280" cy="45" r="3" fill="${E}"/>` + txt(286, 44, 'C', { g: 800, c: E }) +
    txt(70, 106, '1', { a: 'middle', g: 800 }) + txt(180, 106, '2', { a: 'middle', g: 800 }) + txt(280, 106, '3', { a: 'middle', g: 800 }), 'Trois plaques homogènes : un triangle avec le point A, un rectangle avec le point B en son centre, un chevron en V avec le point C');
  const FIG7b = svg(140, 110, `<circle cx="70" cy="55" r="45" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><circle cx="98" cy="40" r="3" fill="${E}"/>` + txt(104, 40, 'D', { g: 800, c: E }), 'Disque homogène avec un point D éloigné de son centre');
  // ex. 9 : les quatre phases du saut (1 N = 0,09 px)
  const FIG9 = (() => {
    const k = .09, cas = [0, 350, 700, 800];
    let s = '';
    cas.forEach((f, i) => {
      const x = 45 + i * 85, y = 105;
      s += `<circle cx="${x}" cy="${y}" r="7" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/>` + txt(x, 18, String(i + 1), { a: 'middle', g: 800, c: E, t: 14 });
      s += fl(x, y, x, y + 800 * k, COUL.P, { ep: 2.6 }) + nom(x + 14, y + 66, 'P', '', COUL.P);
      if (f) s += fl(x, y, x, y - f * k, COUL.Fair, { ep: 2.6 }) + nom(x + 20, y - f * k + 12, 'F', 'air', COUL.Fair, { t: 13 }) + txt(x, y - f * k - 6, `${f} N`, { a: 'middle', t: 11 });
      else s += txt(x, y - 14, 'F = 0', { a: 'middle', t: 11 });
    });
    return svg(350, 190, s, 'Quatre phases du saut : 1 : seul le poids ; 2 : force de l\'air 350 newtons ; 3 : 700 newtons ; 4 : 800 newtons ; le poids vaut 800 newtons');
  })();
  // ex. 14 : v(t) de la perchiste
  const FIG14 = (() => {
    const X = t => 40 + t * 44, Y = v => 180 - v * 16;
    let s = '';
    for (let t = 0; t <= 7; t++) s += `<line x1="${X(t)}" y1="${Y(0)}" x2="${X(t)}" y2="${Y(10)}" stroke="#ebe8e1"/>` + txt(X(t), Y(0) + 15, String(t), { a: 'middle', t: 11 });
    for (let v = 0; v <= 10; v += 2) s += `<line x1="${X(0)}" y1="${Y(v)}" x2="${X(7)}" y2="${Y(v)}" stroke="#ebe8e1"/>` + txt(X(0) - 6, Y(v) + 4, String(v), { a: 'end', t: 11 });
    s += fl(X(0), Y(0), X(7.4), Y(0), E, { ep: 1.4, lt: 8 }) + fl(X(0), Y(0), X(0), Y(10.6), E, { ep: 1.4, lt: 8 }) + txt(X(7.4), Y(0) - 6, 't (s)', { a: 'end', t: 11, c: E }) + txt(X(0) + 6, Y(10.5), 'v (m·s⁻¹)', { t: 11, c: E });
    let d = `M${X(0)},${Y(0)}`;
    for (let t = .1; t <= 3.0001; t += .1) d += ` L${X(t).toFixed(1)},${Y(6 * (1 - Math.pow(Math.max(0, 1 - t / 3), 2.2))).toFixed(1)}`;
    d += ` L${X(4.5)},${Y(6)} L${X(7)},${Y(9)}`;
    s += `<path d="${d}" fill="none" stroke="#5a3fc4" stroke-width="2.6"/>`;
    return `<svg viewBox="0 0 380 200" class="ln-graphe" role="img" aria-label="Vitesse de la perchiste en fonction du temps : elle augmente jusqu'à 6 mètres par seconde vers 3 s, reste à 6 jusqu'à 4,5 s, puis augmente en ligne droite jusqu'à 9 mètres par seconde à 7 s">${s}</svg>`;
  })();
  // ex. 15 : skieur sur une piste qui descend vers la gauche
  const FIG15 = (() => {
    const a = rad(20), A = [20, 150], B = [320, 150 - 300 * Math.tan(a)], M = [190, 150 - 170 * Math.tan(a)];
    let s = `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${E}" stroke-width="2"/><line x1="${A[0]}" y1="${A[1]}" x2="${A[0] + 130}" y2="${A[1]}" stroke="#8d8f94"/>`;
    s += `<path d="M${A[0] + 50},${A[1]} A50,50 0 0 0 ${A[0] + 50 * Math.cos(a)},${A[1] - 50 * Math.sin(a)}" fill="none" stroke="#5a3fc4" stroke-width="1.5"/>` + txt(A[0] + 56, A[1] - 6, 'α', { g: 800, c: '#5a3fc4', t: 13 });
    s += fl(M[0], M[1], M[0] - 70 * Math.sin(a), M[1] - 70 * Math.cos(a), COUL.RN, { ep: 2.6 }) + nom(M[0] - 70 * Math.sin(a) - 18, M[1] - 64, 'R', '', COUL.RN);
    s += fl(M[0], M[1], M[0], M[1] + 70, COUL.P, { ep: 2.6 }) + nom(M[0] + 14, M[1] + 66, 'P', '', COUL.P);
    s += `<circle cx="${M[0]}" cy="${M[1]}" r="3.5" fill="${E}"/>` + txt(M[0] - 18, M[1] + 4, 'M', { g: 800, c: E });
    s += fl(120, 40, 60, 40 + 60 * Math.tan(a), '#8d8f94', { ep: 1.6, lt: 8 }) + txt(126, 40, 'sens du mouvement', { t: 11 });
    return svg(340, 200, s, 'Piste descendant vers la gauche d\'un angle alpha ; au point M, le poids est vertical vers le bas, la réaction perpendiculaire à la piste');
  })();
  // ex. 16 : Philae au-dessus de la comète, axe Oy vers le haut
  const FIG16 = svg(220, 200, `<circle cx="80" cy="172" r="26" fill="#ebe8e1" stroke="${E2}" stroke-width="1.5"/>` + txt(112, 182, 'comète 67P', { t: 11 }) +
    fl(80, 146, 80, 14, E, { ep: 1.4, lt: 8 }) + txt(88, 20, 'y', { g: 800, c: E }) + txt(66, 150, 'O', { t: 12 }) + fl(80, 146, 80, 118, '#5c940d', { ep: 2.2, lt: 8 }) + nom(96, 132, 'j', '', '#5c940d', { t: 13 }) +
    `<rect x="70" y="48" width="20" height="12" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><line x1="72" y1="60" x2="66" y2="70" stroke="#5a3fc4" stroke-width="2"/><line x1="88" y1="60" x2="94" y2="70" stroke="#5a3fc4" stroke-width="2"/>` + txt(98, 52, 'Philae', { t: 11 }),
  'Philae au-dessus de la comète, sur l\'axe Oy vertical dirigé vers le haut, origine au sol de la comète');
  // ex. 17 et 18 : voiture-jouet sur une rampe
  const FIG17 = svg(300, 110, `<path d="M20,100 L280,100 L20,30 Z" fill="#f3f1ec" stroke="${E}" stroke-width="2"/>` +
    `<g transform="translate(140,62) rotate(15.1)"><rect x="-26" y="-16" width="52" height="14" rx="4" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><circle cx="-14" cy="0" r="5" fill="${E}"/><circle cx="14" cy="0" r="5" fill="${E}"/></g>`, 'Voiture-jouet sur une rampe inclinée');
  // ex. 19 : tube de glycérol, axe y vers le bas
  const FIG19 = svg(200, 240, `<rect x="70" y="20" width="40" height="200" rx="4" fill="#f4e9f0" stroke="${E2}" stroke-width="1.5"/><circle cx="90" cy="34" r="9" fill="#dfe3ea" stroke="${E}" stroke-width="1.5"/>` +
    [['O', 24], ['D', 100], ['F', 150], ['S', 216]].map(([n, y]) => `<line x1="70" y1="${y}" x2="110" y2="${y}" stroke="${n === 'O' || n === 'S' ? 'none' : '#fff'}" stroke-width="2"/>` + txt(60, y + 4, n, { a: 'end', g: 800, c: E })).join('') +
    fl(140, 24, 140, 226, E, { ep: 1.4, lt: 8 }) + txt(148, 226, 'y', { g: 800, c: E }) + fl(140, 24, 140, 54, '#5c940d', { ep: 2.2, lt: 8 }) + nom(156, 42, 'j', '', '#5c940d', { t: 13 }) + txt(16, 38, 'bille', { t: 11 }),
  'Tube de glycérol : la bille en haut au point O, les traits D et F, le fond S ; axe y vertical vers le bas');
  // ex. 20 : parapente, trajectoire rectiligne descendante faisant l'angle α avec l'horizontale
  const FIG20 = (() => {
    const O = [40, 60], a = rad(14);
    let s = fl(O[0], O[1], 330, O[1], E, { ep: 1.4, lt: 8 }) + txt(328, O[1] + 16, 'x', { g: 800, c: E }) + fl(O[0], 190, O[0], 10, E, { ep: 1.4, lt: 8 }) + txt(O[0] + 8, 18, 'y', { g: 800, c: E }) + txt(O[0] - 14, O[1] + 14, 'O');
    s += `<line x1="${O[0]}" y1="${O[1]}" x2="${O[0] + 300}" y2="${O[1] + 300 * Math.tan(a)}" stroke="${E}" stroke-width="3" stroke-dasharray="6 4"/>` + txt(250, 118, 'trajectoire', { t: 11 });
    s += `<path d="M${O[0] + 180},${O[1]} A180,180 0 0 1 ${O[0] + 180 * Math.cos(a)},${O[1] + 180 * Math.sin(a)}" fill="none" stroke="#5a3fc4" stroke-width="1.5"/>` + txt(O[0] + 186, O[1] + 26, 'α', { g: 800, c: '#5a3fc4', t: 14 });
    s += fl(O[0], O[1], O[0] + 60, O[1] + 60 * Math.tan(a), '#1971c2', { ep: 2.6 }) + nom(O[0] + 40, O[1] + 34, 'v', '0', '#1971c2');
    s += `<circle cx="${O[0] + 90}" cy="${O[1] + 90 * Math.tan(a)}" r="4" fill="${E}"/>` + txt(O[0] + 96, O[1] + 90 * Math.tan(a) - 6, 'G', { g: 800, c: E });
    return svg(340, 200, s, 'Repère O, x horizontal, y vertical ; la trajectoire de G est une droite qui descend en faisant l\'angle alpha avec l\'axe x');
  })();

  /* ---------- question complexe (ex. 20) ----------
     p = { type: 'perso', q, label, valeur, rel, unite, diag, etapes: [parties], reflexe } :
     la question telle quelle (une valeur à trouver), puis, sur demande, les étapes
     (BF.question en mode exercice) ; demander les étapes compte comme une erreur. */
  function complexe(p) {
    return Object.assign({ type: 'perso', monter(zone, api) {
      const d = document.createElement('div');
      d.className = 'ln-complexe';
      d.innerHTML = `<div class="ph-valeur"><span class="ph-lab">${p.label}</span><span data-ch></span><span class="ph-unite">${p.unite}</span>${LN.CALC}</div>
        <div class="er-actions"><button type="button" class="btn-primary" data-v>Valider</button><button type="button" class="btn-secondary" data-e>Je ne sais pas par où commencer</button></div>
        <div class="ln-complexe-etapes" hidden></div>`;
      zone.appendChild(d);
      const ch = BF.champ({ signe: false });
      d.querySelector('[data-ch]').appendChild(ch.el);
      const bV = d.querySelector('[data-v]'), bE = d.querySelector('[data-e]'), et = d.querySelector('.ln-complexe-etapes');
      const finir = () => { ch.desactiver(true); bV.disabled = true; bE.disabled = true; };
      bV.onclick = () => {
        if (api.fini()) return;
        const v = BF.lire(ch.input.value);
        if (isNaN(v)) { api.message('Écris un nombre (avec une virgule si besoin).'); return; }
        if (BF.proche(v, p.valeur, p.rel)) { finir(); et.hidden = true; api.reussi(); return; }
        api.erreur((p.diag && p.diag(v)) || 'Vérifie ton raisonnement, ou demande les étapes.');
      };
      bE.onclick = () => {
        if (api.fini() || !et.hidden) return;
        api.compterErreur();
        et.hidden = false; bE.disabled = true;
        et.innerHTML = `<p class="ph-msg">${p.reflexe}</p><div></div>`;
        BF.question(et.lastElementChild, { parties: p.etapes.map(x => Object.assign({}, x)) }, { fin() { finir(); api.reussi(); } }, 'exercice');
      };
      return { montrer() { ch.input.value = BF.fmt(p.affiche || p.valeur); finir(); et.hidden = true; } };
    } }, p);
  }

  /* ============================================================
     LES EXERCICES
     ============================================================ */
  const P_ACC = [['acc', 'mouvement rectiligne accéléré'], ['dec', 'mouvement rectiligne décéléré'], ['unif', 'mouvement rectiligne uniforme']];
  const EXERCICES = [
    /* ---------- Bilans des forces ---------- */
    { id: '1', groupe: 'bilan', titre: 'Bilans des forces', desc: 'Valise portée, valise posée, lancer du poids, bateau à voile, caravane',
      contexte: '<p>Faire le bilan des forces qui s\'exercent sur les objets et les représenter : valise portée ; valise posée sur le sol ; poids qui va être lancé ; poids qui vient d\'être lancé ; bateau à voile qui avance ; caravane tractée par une voiture qui freine.</p><p class="er-petit">Pour chaque objet : diagramme objet-action, puis tracé et noms des forces (outil de l\'application « Bilan des forces »).</p>',
      parties: () => bilans([[S.valisePortee, 'a) '], [S.valisePosee, 'b) '], [S.poidsAvant, 'c) '], [S.poidsLance, 'd) '], [S.bateau, 'e) '], [S.caravane, 'f) ']]) },
    { id: '2', groupe: 'bilan', titre: 'Deux skieurs', desc: 'Skieur qui descend une piste, skieur tiré par un téléski',
      contexte: '<p>Faire le bilan des forces qui s\'exercent sur les skieurs et les représenter. Dans les deux cas, on néglige les frottements de l\'air ; si on néglige les frottements du sol, la réaction est perpendiculaire au sol.</p>',
      parties: () => bilans([[S.skieur, 'a) '], [S.teleski, 'b) ']]) },
    { id: '3', groupe: 'bilan', titre: 'Livre sur un plan incliné', desc: 'Livre immobile : les forces se compensent',
      contexte: '<p>Représenter un livre posé immobile sur un plan incliné et dessiner les forces qui s\'exercent dessus.</p>',
      parties: () => bilans([[S.livreIncline, '']], 'tout') },
    { id: '4', groupe: 'bilan', titre: 'Roues d\'une voiture', desc: 'Traction avant : au démarrage et au freinage',
      contexte: '<p>Dessiner les forces de contact des roues avant et arrière d\'une voiture (traction avant) au démarrage et au freinage.</p>',
      parties: () => bilans([[S.voiture, 'a) '], [S.voitureFrein, 'b) ']]).concat([
        choix('c) Sans frottement, au démarrage, que feraient les roues ?', [['ok', 'la roue arrière glisserait sans tourner, la roue avant patinerait sans avancer'], ['tout', 'les deux roues rouleraient normalement'], ['inv', 'la roue avant glisserait sans tourner, la roue arrière patinerait']], 'ok',
          '<p>Sans frottement : la roue arrière (non motrice) avancerait sans tourner, la roue avant (motrice) tournerait sans avancer (patinage). Au freinage, les deux roues glisseraient, bloquées.</p>')]) },
    /* ---------- Vecteurs ---------- */
    { id: '5', groupe: 'vecteurs', titre: 'Coordonnées de vecteurs', desc: 'Lire les coordonnées sur un quadrillage',
      contexte: `<p>Déterminer les coordonnées de chacun des vecteurs représentés ci-dessous.</p>${FIG5}`,
      parties: [
        gabarit('a) Coordonnées de <span class="vec-nom">R</span> :', '', ['<span class="vec-nom">R</span> (', { v: 0 }, ' ; ', { v: 2 }, ')'], `<p>${V('R')} monte de 2 carreaux, sans se déplacer horizontalement : ${V('R')} (0 ; 2).</p>`),
        gabarit('b) Coordonnées de <span class="vec-nom">P</span> :', '', ['<span class="vec-nom">P</span> (', { v: 0 }, ' ; ', { v: -2 }, ')'], `<p>${V('P')} descend de 2 carreaux : ${V('P')} (0 ; −2).</p>`, { diag: v => (v[1] === 2 ? 'Vers le bas : la coordonnée est négative.' : '') }),
        gabarit('c) Coordonnées de <span class="vec-nom">T</span> :', '', ['<span class="vec-nom">T</span> (', { v: 5 }, ' ; ', { v: 3 }, ')'], `<p>${V('T')} va de 5 carreaux vers la droite et de 3 vers le haut : ${V('T')} (5 ; 3).</p>`, { diag: v => (v[0] === 3 && v[1] === 5 ? 'Les coordonnées sont inversées : d\'abord x, puis y.' : '') }),
      ] },
    { id: '6', groupe: 'vecteurs', titre: 'Projections de <span class="vec-nom">v</span>₀', desc: 'Coordonnées en fonction de la norme et de l\'angle',
      contexte: `<p>Donner les coordonnées des vecteurs en fonction de leur norme et de l'angle donné sur le schéma.</p><div class="ln-figs2">${fig6('a')}${fig6('b')}</div>`,
      parties: [
        choix('a) Premier schéma (angle α avec l\'axe Ox) :', [['ok', 'v<sub>0x</sub> = v<sub>0</sub> cos α ; v<sub>0y</sub> = v<sub>0</sub> sin α'], ['inv', 'v<sub>0x</sub> = v<sub>0</sub> sin α ; v<sub>0y</sub> = v<sub>0</sub> cos α'], ['tan', 'v<sub>0x</sub> = v<sub>0</sub> ; v<sub>0y</sub> = v<sub>0</sub> tan α']], 'ok',
          `<p>Dans le triangle rectangle : cos α = v<sub>0x</sub> / v<sub>0</sub> donc v<sub>0x</sub> = v<sub>0</sub> cos α ; sin α = v<sub>0y</sub> / v<sub>0</sub> donc v<sub>0y</sub> = v<sub>0</sub> sin α.</p>`, { indices: { inv: 'Le côté adjacent à l\'angle α est sur l\'axe x : c\'est le cosinus.' } }),
        choix('b) Second schéma (angle β avec l\'axe Oy) :', [['ok', 'v<sub>0x</sub> = v<sub>0</sub> sin β ; v<sub>0y</sub> = v<sub>0</sub> cos β'], ['inv', 'v<sub>0x</sub> = v<sub>0</sub> cos β ; v<sub>0y</sub> = v<sub>0</sub> sin β'], ['tan', 'v<sub>0x</sub> = v<sub>0</sub> tan β ; v<sub>0y</sub> = v<sub>0</sub>']], 'ok',
          '<p>L\'angle β est mesuré depuis l\'axe y : sin β = v<sub>0x</sub> / v<sub>0</sub> donc v<sub>0x</sub> = v<sub>0</sub> sin β ; cos β = v<sub>0y</sub> / v<sub>0</sub> donc v<sub>0y</sub> = v<sub>0</sub> cos β.</p>', { indices: { inv: 'Ici, le côté adjacent à l\'angle β est sur l\'axe y.' } }),
      ] },
    { id: '7', groupe: 'vecteurs', titre: 'Centre de masse', desc: 'Plaques homogènes',
      contexte: `<p>a. Justifier qualitativement la position du centre de masse pour chaque plaque homogène schématisée ci-dessous.</p>${FIG7}<p>b. Justifier en quoi le point D sur la plaque homogène représentée ci-contre n'est pas son centre de masse.</p>${FIG7b}`,
      parties: [
        choix('a) Les points A, B et C sont-ils les centres de masse des plaques ?', [['oui', 'oui : pour un solide homogène, le centre de masse est au centre de l\'objet'], ['non', 'non : le centre de masse est toujours sur la matière'], ['b', 'seulement B, au centre du rectangle']], 'oui',
          '<p>Pour des solides homogènes, le centre de masse doit être au centre de l\'objet (sur ses axes de symétrie). C\'est bien le cas ici, même pour C qui est en dehors de la matière du chevron.</p>', { indices: { non: 'Pour le chevron en V, le centre de masse peut être hors de la matière.', b: 'A et C sont aussi au centre de leur plaque (sur l\'axe de symétrie).' } }),
        choix('b) Pourquoi D n\'est-il pas le centre de masse du disque ?', [['ok', 'D n\'est pas au centre du disque, qui est homogène'], ['bord', 'D est trop près du bord pour être un point de l\'objet'], ['masse', 'un disque n\'a pas de centre de masse']], 'ok', '<p>D n\'est pas au centre de l\'objet (homogène) : ce n\'est pas son centre de masse.</p>'),
      ] },
    /* ---------- Deuxième loi : calculs ---------- */
    { id: '8', groupe: 'calculs', titre: 'Avion de chasse', desc: 'Accélération connaissant la force de propulsion',
      contexte: '<p>Un avion de chasse de masse 15 t possède une force de propulsion F = 150 kN horizontale. Estimer la norme de son accélération a<sub>G</sub> (frottements négligés).</p>',
      parties: [
        choix('a) Bilan des forces et résultante :', [['ok', `${V('P')} et ${V('R')} se compensent, donc ${SFX} = ${V('F')}`], ['tout', `${SFX} = ${V('P')} + ${V('F')}`], ['nul', `${SFX} = ${NUL}`]], 'ok',
          `<p>Bilan des forces : ${V('P')}, ${V('R')} (réaction normale du sol), ${V('F')} (force de propulsion) ; frottements négligés. ${V('P')} et ${V('R')} se compensent (${V('R')} = −${V('P')}), donc ${SFX} = ${V('P')} + ${V('R')} + ${V('F')} = ${V('F')}.</p>`),
        nombre('b) Norme de l\'accélération :', 'a<sub>G</sub> =', 10, MS2, `<p>${REDAC('terrestre', 'l\'avion')} Donc ${V('a', 'G')} = ${V('F')} / m et :</p>${calc(`a<sub>G</sub> = F / m = 150 × 10<sup>3</sup> / (15 × 10<sup>3</sup>) = ${c(`10 ${MS2}`)}`)}`,
          { rel: .01, diag: v => (Math.abs(v - .01) < 1e-6 || Math.abs(v - 10000) < 1 ? 'Convertis : 15 t = 15 × 10<sup>3</sup> kg et 150 kN = 150 × 10<sup>3</sup> N.' : 'a = F / m, en N et en kg.') }),
      ] },
    { id: '9', groupe: 'calculs', titre: 'Chute d\'un parachutiste', desc: 'Accélération dans quatre phases du saut',
      contexte: `<p>Lors d'un saut, selon la position et la vitesse d'un parachutiste, la valeur de la force exercée par l'air sur lui varie. Pour chacun des quatre exemples ci-dessous, la trajectoire est supposée verticale.</p>${FIG9}<p>a. Déterminer les caractéristiques et représenter le vecteur accélération du parachutiste. b. Préciser la nature du mouvement de chute (accéléré, décéléré ou uniforme).</p><p><b>Données</b> : masse du parachutiste m = 80 kg ; g = 10 m·s<sup>−2</sup>.</p>`,
      parties: [
        nombre('a) Valeur du poids :', 'P =', 800, 'N', calc(`P = m × g = 80 × 10 = ${c('800 N')}`)),
        nombre('Cas ① (seul le poids) : valeur de l\'accélération', 'a<sub>1</sub> =', 10, MS2, `<p>${REDAC('terrestre', 'le parachutiste')} ${SFX} = ${V('P')}, donc :</p>${calc(`a<sub>1</sub> = P / m = 800 / 80 = ${c(`10 ${MS2}`)}`)}`),
        nombre('Cas ② (F<sub>air</sub> = 350 N) :', 'a<sub>2</sub> =', 5.625, MS2, calc(`Σ F<sub>ext</sub> = 800 − 350 = 450 N ; a<sub>2</sub> = 450 / 80 = 5,625 ≈ ${c(`5,6 ${MS2}`)}`), { rel: .01, calc: true, affiche: '5,6', diag: v => (Math.abs(v - 350 / 80) < .01 ? 'Le poids et la force de l\'air sont opposés : Σ F = P − F<sub>air</sub>.' : 'Σ F = P − F<sub>air</sub>, puis a = Σ F / m.') }),
        nombre('Cas ③ (F<sub>air</sub> = 700 N) :', 'a<sub>3</sub> =', 1.25, MS2, calc(`Σ F<sub>ext</sub> = 800 − 700 = 100 N ; a<sub>3</sub> = 100 / 80 = 1,25 ≈ ${c(`1,3 ${MS2}`)}`), { rel: .04, calc: true, affiche: '1,3' }),
        nombre('Cas ④ (F<sub>air</sub> = 800 N) :', 'a<sub>4</sub> =', 0, MS2, calc(`Σ F<sub>ext</sub> = 800 − 800 = 0 N, donc ${c(`a<sub>4</sub> = 0 ${MS2}`)}`), { tol: .001 }),
        choix('Direction et sens de l\'accélération (cas ① à ③) :', [['bas', 'verticale, vers le bas'], ['haut', 'verticale, vers le haut'], ['hor', 'horizontale']], 'bas', `<p>${V('a')} = ${SFX} / m : même direction et même sens que ${SFX}, ici celui du poids (le plus grand) : verticale, vers le bas.</p>`),
        choix('b) Nature du mouvement dans les cas ①, ② et ③ :', P_ACC, 'acc', '<p>L\'accélération est vers le bas, dans le sens du mouvement : le mouvement est rectiligne accéléré (de moins en moins, de ① à ③).</p>', { indices: { dec: 'L\'accélération est dans le sens du mouvement (vers le bas).' } }),
        choix('Nature du mouvement dans le cas ④ :', P_ACC, 'unif', '<p>a = 0 : la vitesse est constante, le mouvement est rectiligne uniforme.</p>'),
      ] },
    { id: '10', groupe: 'calculs', titre: 'Balle de golf qui ralentit', desc: 'Résultante et frottements de l\'herbe',
      contexte: `<p>Une balle de golf de masse m = 46 g roule sur un green ; sa vitesse passe de 10 ${MS} à 0 ${MS} en 4,0 s à cause de l'action des frottements ${V('f')} de l'herbe sur la balle. Calculer la norme de Σ ${V('F', 'ext')} puis la norme de ${V('f')}.</p>`,
      parties: [
        nombre('a) En supposant l\'accélération constante, sa norme vaut :', 'a =', 2.5, MS2, calc(`a<sub>x</sub> = Δv<sub>x</sub> / Δt = (0 − 10) / 4,0 = −2,5 ${MS2} : décélération de norme ${c(`a = 2,5 ${MS2}`)}`), { rel: .01 }),
        nombre('b) Norme de la résultante des forces :', 'Σ F<sub>ext</sub> =', .115, 'N', `<p>${REDAC('terrestre', 'la balle')}</p>${calc(`Σ F<sub>ext</sub> = m × a = 46 × 10<sup>−3</sup> × 2,5 = 0,115 ≈ ${c('0,12 N')}`)}`,
          { rel: .05, calc: true, affiche: '0,12', diag: v => (Math.abs(v - 115) < 1 ? 'Convertis la masse en kg : 46 g = 46 × 10<sup>−3</sup> kg.' : 'Σ F<sub>ext</sub> = m × a, m en kg.') }),
        nombre('c) Norme des frottements :', 'f =', .115, 'N', `<p>Bilan des forces : ${V('P')}, ${V('R')} (réaction du sol) et ${V('f')} ; ${V('P')} + ${V('R')} = ${NUL}, donc ${SFX} = ${V('f')} et ${c('f = 0,12 N')}.</p>`, { rel: .05, affiche: '0,12' }),
      ] },
    { id: '11', groupe: 'inertie', titre: 'Caddie poussé', desc: 'Force constante : quel mouvement ?',
      contexte: '<p>On pousse un caddie avec une force constante. Quel est le mouvement du caddie ? (On néglige les frottements.)</p>',
      parties: [
        choix('a) Résultante des forces :', [['ok', `${V('P')} et ${V('R')} se compensent : ${SFX} = ${V('F')}`], ['nul', `${SFX} = ${NUL} car la force est constante`], ['pr', `${SFX} = ${V('P')} + ${V('F')}`]], 'ok',
          `<p>Bilan des forces : poids ${V('P')}, réaction du sol sur les roues ${V('R')} = −${V('P')} (frottements négligés), force de poussée ${V('F')}. Donc ${SFX} = ${V('P')} + ${V('R')} + ${V('F')} = ${V('F')}.</p>`),
        choix('b) Mouvement du caddie :', [['ok', 'rectiligne uniformément accéléré'], ['unif', 'rectiligne uniforme, car la force est constante'], ['dec', 'rectiligne ralenti']], 'ok',
          `<p>${REDAC('terrestre', 'le caddie')} Donc ${V('a')} = ${V('F')} / m : l'accélération est constante, le caddie a un mouvement rectiligne uniformément accéléré.</p>`, { indices: { unif: 'Une force constante non compensée donne une accélération constante, pas une vitesse constante.' } }),
      ] },
    { id: '12', groupe: 'calculs', titre: 'Parachutiste en soufflerie', desc: 'Caractéristiques de la force de l\'air',
      contexte: `<p>Un parachutiste s'entraîne dans une soufflerie verticale et se maintient en équilibre dans l'air soufflé. Sa masse est 100 kg, équipement compris. Déterminer les caractéristiques de la force de l'air ${V('f')} exercée sur le parachutiste. (On prend g = 10 N·kg<sup>−1</sup>.)</p>`,
      parties: [
        choix('a) Que vaut la résultante des forces ?', [['nul', `${SFX} = ${NUL}, car il est immobile`], ['p', `${SFX} = ${V('P')}`], ['f', `${SFX} = ${V('f')}`]], 'nul', `<p>Bilan des forces : poids ${V('P')} et force de l'air ${V('f')}. ${REDAC('terrestre', 'le parachutiste')} Il est immobile : ${V('a')} = ${NUL}, donc ${SFX} = ${NUL}.</p>`),
        choix('b) Direction et sens de la force de l\'air :', [['haut', 'verticale, vers le haut'], ['bas', 'verticale, vers le bas'], ['hor', 'horizontale']], 'haut', `<p>${V('P')} + ${V('f')} = ${NUL} ⟺ ${V('f')} = −${V('P')} : verticale, vers le haut.</p>`),
        nombre('c) Valeur de la force de l\'air :', 'f =', 1000, 'N', calc(`f = P = m × g = 100 × 10 = ${c('1 000 N')}`), { rel: .025 }),
      ] },
    { id: '13', groupe: 'inertie', titre: 'Balle dans un train', desc: 'Le référentiel du train est-il galiléen ?',
      contexte: '<p>Un passager est assis dans un train qui roule à vitesse constante sur une section de voie droite. Il observe une balle posée sur la tablette devant lui et remarque que la balle est immobile par rapport à lui.</p><p>a. Faire le bilan des forces qui s\'appliquent sur la balle. Déterminer si le référentiel du siège du passager peut être considéré comme galiléen. Justifier la réponse.</p><p>b. Le train entre dans un virage. La valeur de la vitesse du train reste constante. Le passager observe la balle rouler lentement vers le côté gauche. Déterminer si le bilan des forces qui s\'appliquent sur la balle a changé. Peut-on en déduire que le référentiel du siège du passager est toujours galiléen ? Justifier la réponse.</p>',
      parties: [
        choix('a) Bilan des forces sur la balle :', [['ok', `${V('P')} et ${V('R')} (réaction de la tablette), qui se compensent`], ['plus', `${V('P')}, ${V('R')} et la force du train`], ['p', `${V('P')} seul`]], 'ok', `<p>${V('P')} et ${V('R')} se compensent : ${SFX} = ${V('P')} + ${V('R')} = ${NUL}.</p>`),
        choix('Le référentiel du siège est-il galiléen ?', [['oui', 'oui : la balle est immobile et Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span>, le principe d\'inertie est vérifié'], ['non', 'non : le train bouge']], 'oui', '<p>La balle est immobile et la résultante est nulle : le principe d\'inertie est vérifié dans ce référentiel, qui est donc galiléen (le train est en mouvement rectiligne uniforme).</p>', { indices: { non: 'Un référentiel en mouvement rectiligne uniforme peut être galiléen : vérifie le principe d\'inertie.' } }),
        choix('b) Dans le virage, le bilan des forces a-t-il changé ?', [['non', `non : ${V('P')} + ${V('R')} = ${NUL}`], ['oui', 'oui : une force pousse la balle vers la gauche']], 'non', `<p>Le bilan reste inchangé : ${V('P')} ne change pas et aucun nouvel objet ne vient au contact de la balle ; ${V('P')} + ${V('R')} = ${NUL}.</p>`, { indices: { oui: 'Quel objet toucherait la balle pour la pousser ? Aucun.' } }),
        choix('Le référentiel du siège est-il toujours galiléen ?', [['non', 'non : Σ <span class="vec-nom">F</span> = <span class="vec-nom">0</span> mais la balle ne reste pas immobile'], ['oui', 'oui : la vitesse du train est constante']], 'non', '<p>La balle ne reste pas immobile alors que la résultante est nulle : le principe d\'inertie n\'est pas vérifié, le train n\'est plus un référentiel galiléen (il tourne).</p>', { indices: { oui: 'Dans un virage, la direction de la vitesse change.' } }),
      ] },
    /* ---------- Analyse du mouvement ---------- */
    { id: '14', groupe: 'analyse', titre: 'Course d\'élan d\'une perchiste', desc: 'Graphique v(t) : nature du mouvement, accélération',
      contexte: `<p>Lors d'un saut à la perche, une perchiste prend son élan en courant en ligne droite sur une distance d'environ 40 m et elle atteint une valeur de vitesse maximale au moment de l'impulsion à la date t = 7,0 s, comme le montre le graphique ci-dessous.</p>${FIG14}`,
      parties: [
        choix('a) Mouvement de la perchiste entre 3,0 s et 4,0 s :', [['unif', 'rectiligne uniforme'], ['acc', 'rectiligne accéléré'], ['dec', 'rectiligne ralenti']], 'unif', '<p>La vitesse est constante (6 m·s<sup>−1</sup>) et elle court en ligne droite : mouvement rectiligne uniforme.</p>'),
        nombre('b) Valeur de l\'accélération entre 4,5 s et 7,0 s :', 'a =', 1.2, MS2, `<p>L'accélération est la dérivée de la vitesse. Entre 4,5 s et 7 s, la vitesse augmente linéairement : l'accélération est constante, égale au coefficient directeur de la droite.</p>${calc(`a = (9 − 6) / (7 − 4,5) = ${c(`1,2 ${MS2}`)}`)}`,
          { rel: .05, calc: true, diag: v => (Math.abs(v - 9 / 7) < .05 ? 'Prends la variation de vitesse entre 4,5 s et 7 s, pas depuis l\'origine.' : 'a = Δv / Δt entre 4,5 s et 7,0 s.') }),
        choix('c) Mouvement entre 4,5 s et 7,0 s :', [['ok', 'rectiligne uniformément accéléré'], ['unif', 'rectiligne uniforme'], ['acc', 'rectiligne accéléré, avec une accélération qui augmente']], 'ok', '<p>a constante et positive : mouvement rectiligne uniformément accéléré.</p>'),
      ] },
    { id: '15', groupe: 'analyse', titre: 'Skieur sans frottements', desc: 'Somme des forces sur une piste inclinée',
      contexte: `<p>Un skieur descend sur une piste enneigée rectiligne faisant un angle constant avec le plan horizontal. Les frottements sur le système {skieur + équipement} sont supposés négligeables. Le système est modélisé par un point matériel dont la masse m, constante, est celle du système.</p>${FIG15}`,
      parties: [
        choix('a) Quel point modélise le système ?', [['M', 'le point M'], ['O', 'le point O']], 'M', '<p>Le point matériel M.</p>'),
        choix('b) La somme vectorielle des forces appliquées au système :', [['ok', `${V('P')} + ${V('R')} : parallèle à la piste, vers le bas de la pente`], ['nul', `${V('P')} + ${V('R')} = ${NUL}`], ['vert', `${V('P')} + ${V('R')} : verticale, vers le bas`]], 'ok',
          `<p>En mettant ${V('P')} et ${V('R')} bout à bout, leur somme est parallèle à la piste, dirigée vers le bas de la pente (sens du mouvement).</p>`, { indices: { nul: `${V('R')} est perpendiculaire à la piste et ${V('P')} est vertical : ils ne peuvent pas se compenser.` } }),
        choix('c) Nature du mouvement de M (référentiel terrestre considéré comme galiléen) :', [['ok', 'rectiligne uniformément accéléré'], ['unif', 'rectiligne uniforme'], ['dec', 'rectiligne ralenti']], 'ok',
          `<p>${REDAC('terrestre', 'le skieur')} ${V('a')} = (${V('P')} + ${V('R')}) / m : l'accélération est constante, dirigée vers le bas de la pente, dans le sens du mouvement : mouvement rectiligne uniformément accéléré.</p>`),
      ] },
    { id: '16', groupe: 'analyse', titre: 'Chute de l\'atterrisseur Philae', desc: 'Chute libre sur la comète, durée de la chute',
      contexte: `<p>Le 12 novembre 2014, à la date t = 0 s, l'atterrisseur Philae s'est détaché de la sonde Rosetta pour effectuer une chute libre de 20 km sans vitesse initiale, et se poser sur la comète 67P/Tchourioumov-Guérassimenko. Cette descente a duré plusieurs heures.</p>
        <p>Philae est considéré en chute libre, c'est-à-dire qu'il n'est soumis qu'à son poids. L'axe Oy utilisé pour l'étude est vertical dirigé vers le haut, l'origine étant au niveau du sol de la comète. Le champ de pesanteur de la comète est considéré uniforme, d'intensité moyenne g = 1,5 × 10<sup>−5</sup> N·kg<sup>−1</sup>.</p>${FIG16}`,
      parties: [
        choix(`a) Deuxième loi de Newton dans le référentiel de la comète supposé galiléen :`, [['ok', `m ${V('a')} = m ${V('g')}, donc ${V('a')} = ${V('g')}`], ['nul', `${V('a')} = ${NUL}`], ['m', `${V('a')} = m ${V('g')}`]], 'ok', `<p>Bilan des forces sur {Philae} : son poids ${V('P')} = m ${V('g')} (attraction gravitationnelle de la comète). m ${V('a')} = ${SFX} ⟺ m ${V('a')} = m ${V('g')} ⟺ ${V('a')} = ${V('g')}.</p>`),
        scient('Coordonnée de l\'accélération sur l\'axe Oy :', 'a<sub>y</sub> =', -1.5e-5, MS2, `<p>${V('g')} est dirigé vers le bas, l'axe Oy vers le haut : ${c(`a<sub>y</sub> = −g = −1,5 × 10<sup>−5</sup> ${MS2}`)}. Remarque sur les unités : N·kg<sup>−1</sup> = ${MS2}.</p>`,
          { diag: v => (v > 0 ? 'L\'axe Oy est vers le haut et l\'accélération vers le bas : la coordonnée est négative.' : '') }),
        choix('b) Type de mouvement de Philae :', [['ok', 'rectiligne uniformément accéléré'], ['unif', 'rectiligne uniforme'], ['circ', 'circulaire']], 'ok', '<p>Son vecteur accélération étant constant et n\'ayant pas de vitesse initiale, Philae a un mouvement rectiligne uniformément accéléré.</p>'),
        choix('c) y(t) = bt² + c, avec b = −7,5 × 10<sup>−6</sup> m·s<sup>−2</sup> et c = 20 000 m. Coordonnée du vecteur vitesse :', [['ok', 'v<sub>y</sub>(t) = 2bt'], ['bt', 'v<sub>y</sub>(t) = bt'], ['c', 'v<sub>y</sub>(t) = 2bt + c']], 'ok', '<p>v<sub>y</sub>(t) = dy/dt = 2bt (la dérivée de la constante c est nulle).</p>'),
        scient('Coordonnée de l\'accélération retrouvée :', 'a<sub>y</sub> =', -1.5e-5, MS2, calc(`a<sub>y</sub>(t) = dv<sub>y</sub>/dt = 2b = 2 × (−7,5 × 10<sup>−6</sup>) = ${c(`−1,5 × 10<sup>−5</sup> ${MS2}`)} : on retrouve bien la coordonnée de la question a.`)),
        scient('d) Durée de la chute Δt (à l\'arrivée, y = 0) :', 'Δt =', Math.sqrt(20000 / 7.5e-6), 's', `<p>y(Δt) = 0 ⟺ b Δt² + c = 0 ⟺ Δt = √(−c / b)</p>${calc(`Δt = √(−20 000 / (−7,5 × 10<sup>−6</sup>)) = ${c('5,16 × 10<sup>4</sup> s')}`)}`, { cs: 3, calc: true }),
        nombre('Durée de la chute en heures :', 'Δt =', Math.sqrt(20000 / 7.5e-6) / 3600, 'h', calc(`Δt = 5,16 × 10<sup>4</sup> / 3 600 = ${c('14,3 h')}`), { rel: .01, calc: true, affiche: '14,3' }),
        choix('e) La durée réelle de la chute est de 7 h. Quelle hypothèse est la plus discutable ?', [['g', 'le champ de pesanteur de la comète considéré uniforme'], ['gal', 'le référentiel de la comète supposé galiléen'], ['masse', 'la masse de Philae constante']], 'g',
          '<p>La durée calculée est très supérieure à la durée réelle. Le référentiel de la comète peut raisonnablement être supposé galiléen sur la durée de la chute (translation rectiligne uniforme). Mais l\'attraction gravitationnelle de la comète est d\'autant plus faible qu\'on est loin d\'elle : g n\'est pas uniforme, il augmente quand on se rapproche de la comète.</p>'),
      ] },
    { id: '17', groupe: 'analyse', titre: 'Voiture-jouet sur une rampe', desc: 'Résultante des forces dans chaque phase',
      contexte: `${FIG17}<p>On considère une voiture-jouet qui monte une rampe après avoir subi une brève poussée sur le devant de celle-ci. La voiture-jouet monte la rampe en arrière, atteint son point le plus haut et redescend la rampe. On considère la voiture parfaite de façon à ce qu'aucun frottement ne puisse la freiner.</p><p>Dans chacune des phases du mouvement, décrire la résultante des forces qui s'exercent sur la voiture (direction et sens).</p>`,
      parties: ['La voiture monte :', 'La voiture est à son point le plus haut :', 'La voiture redescend :'].map((q, k) => choix(q, [['bas', 'parallèle à la rampe, vers le bas de la rampe'], ['haut', 'parallèle à la rampe, vers le haut'], ['nul', 'nulle']], 'bas',
        k === 2 ? `<p>Dans toutes les phases, ${SFX} = ${V('P')} + ${V('R')} est la même : parallèle à la rampe, vers le bas (voir l'exercice 18, version guidée).</p>` : `<p>${SFX} = ${V('P')} + ${V('R')} ne dépend pas du mouvement : parallèle à la rampe, vers le bas.</p>`,
        { indices: { haut: 'À la montée, la voiture ralentit : Δ<span class="vec-nom">v</span> est vers le bas de la rampe.', nul: k === 1 ? 'Au point le plus haut, la vitesse est nulle un instant, mais elle change : Σ <span class="vec-nom">F</span> n\'est pas nulle.' : 'La vitesse change : Σ <span class="vec-nom">F</span> n\'est pas nulle.' } })) },
    { id: '18', groupe: 'analyse', titre: 'Voiture-jouet : version guidée', desc: 'Mouvement, accélération, puis résultante',
      contexte: `${FIG17}<p>Cet exercice est une version plus simple de l'exercice précédent. On considère une voiture-jouet qui monte une rampe après avoir subi une brève poussée sur le devant de celle-ci. La voiture-jouet monte la rampe en arrière, atteint son point le plus haut et redescend la rampe. On considère la voiture parfaite de façon à ce qu'aucun frottement ne puisse la freiner.</p>`,
      parties: [
        choix('a) Mouvement dans la phase de montée :', P_ACC.map(x => [x[0], x[1].replace('décéléré', 'ralenti')]), 'dec', '<p>Dans la phase de montée, la voiture a un mouvement rectiligne ralenti.</p>'),
        choix('Mouvement dans la phase de descente :', P_ACC.map(x => [x[0], x[1].replace('décéléré', 'ralenti')]), 'acc', '<p>Dans la phase de descente, la voiture a un mouvement rectiligne accéléré.</p>'),
        choix('b) Vecteur accélération à la montée :', [['bas', 'parallèle à la rampe, vers le bas'], ['haut', 'parallèle à la rampe, vers le haut']], 'bas', '<p>Le mouvement est ralenti : l\'accélération est dans le sens opposé au mouvement, vers le bas de la rampe.</p>'),
        choix('Vecteur accélération à la descente :', [['bas', 'parallèle à la rampe, vers le bas'], ['haut', 'parallèle à la rampe, vers le haut']], 'bas', '<p>Le mouvement est accéléré : l\'accélération est dans le sens du mouvement, vers le bas de la rampe.</p>'),
        choix('c) Résultante des forces :', [['bas', 'parallèle à la rampe, vers le bas, dans toutes les phases'], ['mvt', 'dans le sens du mouvement, dans toutes les phases'], ['nul', 'nulle au point le plus haut']], 'bas',
          `<p>${REDAC('terrestre', 'la voiture')} La résultante a donc même direction et même sens que l'accélération : parallèle à la rampe, vers le bas, dans toutes les phases du mouvement.</p>`),
      ] },
    /* ---------- Chute dans un fluide ---------- */
    { id: '19', groupe: 'fluide', titre: 'Bille dans le glycérol', desc: 'Vitesse limite et viscosité',
      contexte: `<p>Un tube contient du glycérol de viscosité η et de masse volumique ρ<sub>gly</sub>, ainsi qu'une bille en acier de masse volumique ρ<sub>S</sub>, de rayon R et de volume V. À la date t = 0, la bille initialement immobile en haut du tube, au-dessus du glycérol, tombe verticalement dans le glycérol. L'étude est effectuée dans le référentiel du laboratoire supposé galiléen. L'axe y est vertical, orienté vers le bas, de vecteur unitaire ${V('j')}.</p>${FIG19}
        <p><b>Données</b> : rayon de la bille R = 6,0 × 10<sup>−3</sup> m ; ρ<sub>S</sub> = 7 850 kg·m<sup>−3</sup> ; ρ<sub>gly</sub> = 1 260 kg·m<sup>−3</sup>.</p>
        <p>Au cours de sa chute, la bille est soumise à trois forces : son poids ${V('P')} ; la poussée d'Archimède ${V('Π', 'A')}, verticale, vers le haut, de norme Π<sub>A</sub> = ρ<sub>gly</sub> V g ; la force de frottement ${V('f')}, verticale, de sens opposé à ${V('v')} et de norme f = kηRv, où v est la valeur de la vitesse et k une constante sans dimension.</p>
        <p>Lorsque la bille passe devant le trait D et au-delà, sa vitesse devient constante, égale à la vitesse limite v<sub>lim</sub>. La durée de chute Δt entre les deux traits D et F, distants d'une hauteur L, vaut Δt = 0,29 s.</p>`,
      parties: [
        choix('1. Expression vectorielle du poids :', [['ok', `${V('P')} = ρ<sub>S</sub> V g ${V('j')}`], ['moins', `${V('P')} = −ρ<sub>S</sub> V g ${V('j')}`], ['gly', `${V('P')} = ρ<sub>gly</sub> V g ${V('j')}`]], 'ok', `<p>${V('P')} = m<sub>bille</sub> ${V('g')} = m<sub>bille</sub> g ${V('j')} (axe vers le bas), avec m<sub>bille</sub> = ρ<sub>S</sub> × V : ${V('P')} = ρ<sub>S</sub> V g ${V('j')}. Le volume de la bille est V = 4/3 π R<sup>3</sup>.</p>`),
        choix('Expression vectorielle de la poussée d\'Archimède :', [['ok', `${V('Π', 'A')} = −ρ<sub>gly</sub> V g ${V('j')}`], ['plus', `${V('Π', 'A')} = ρ<sub>gly</sub> V g ${V('j')}`], ['s', `${V('Π', 'A')} = −ρ<sub>S</sub> V g ${V('j')}`]], 'ok', `<p>${V('Π', 'A')} est vers le haut, l'axe vers le bas : ${V('Π', 'A')} = −ρ<sub>gly</sub> V g ${V('j')}.</p>`),
        choix('Expression vectorielle de la force de frottement :', [['ok', `${V('f')} = −kηRv ${V('j')}`], ['plus', `${V('f')} = kηRv ${V('j')}`]], 'ok', `<p>${V('f')} est de sens opposé au mouvement (vers le bas) : vers le haut, ${V('f')} = −kηRv ${V('j')}.</p>`),
        choix('2. a) Nature du mouvement au-delà du trait D :', [['ok', 'rectiligne uniforme, avec v<sub>lim</sub> = L / Δt'], ['acc', 'rectiligne uniformément accéléré'], ['inv', 'rectiligne uniforme, avec v<sub>lim</sub> = Δt / L']], 'ok', '<p>La vitesse est constante : mouvement rectiligne uniforme, et v<sub>lim</sub> = L / Δt.</p>'),
        choix('b) Relation entre les forces entre D et F :', [['ok', `${V('P')} + ${V('Π', 'A')} + ${V('f')} = ${NUL}`], ['p', `${V('P')} = ${V('Π', 'A')} + ${V('f')}`], ['ma', `${V('P')} + ${V('Π', 'A')} + ${V('f')} = m ${V('a')} ≠ ${NUL}`]], 'ok',
          `<p>${REDAC('terrestre', 'la bille')} Or ${V('a')} = ${NUL} car la vitesse est constante. Soit ${V('P')} + ${V('Π', 'A')} + ${V('f')} = ${NUL}.</p>`),
        choix('En projetant sur l\'axe Oy, on obtient :', [['ok', 'ρ<sub>S</sub> V g − ρ<sub>gly</sub> V g − kηR v<sub>lim</sub> = 0'], ['sig', 'ρ<sub>S</sub> V g + ρ<sub>gly</sub> V g − kηR v<sub>lim</sub> = 0'], ['tout', 'ρ<sub>S</sub> V g − ρ<sub>gly</sub> V g + kηR v<sub>lim</sub> = 0']], 'ok',
          `<p>ρ<sub>S</sub> V g − ρ<sub>gly</sub> V g − kηR v<sub>lim</sub> = 0 ⟺ kηR v<sub>lim</sub> = (ρ<sub>S</sub> − ρ<sub>gly</sub>) V g ⟺ η = V g (ρ<sub>S</sub> − ρ<sub>gly</sub>) / (kR v<sub>lim</sub>) = V g Δt (ρ<sub>S</sub> − ρ<sub>gly</sub>) / (kRL). Soit η = C (ρ<sub>S</sub> − ρ<sub>gly</sub>) Δt avec C = Vg / (kRL).</p>`),
        nombre('c) Viscosité du glycérol, sachant que C = 7,84 × 10<sup>−4</sup> m<sup>2</sup>·s<sup>−2</sup> :', 'η =', 7.84e-4 * (7850 - 1260) * 0.29, 'Pa·s',
          `${calc(`η = C (ρ<sub>S</sub> − ρ<sub>gly</sub>) Δt = 7,84 × 10<sup>−4</sup> × (7 850 − 1 260) × 0,29 = ${c('1,50 Pa·s')}`)}<p>Toutes les données sont dans les unités du système international. Homogénéité : m<sup>2</sup>·s<sup>−2</sup> · kg·m<sup>−3</sup> · s = kg·m<sup>−1</sup>·s<sup>−1</sup> ; et Pa·s = N·m<sup>−2</sup>·s = kg·m·s<sup>−2</sup>·m<sup>−2</sup>·s = kg·m<sup>−1</sup>·s<sup>−1</sup> (N = kg·m·s<sup>−2</sup> d'après la deuxième loi de Newton) : la relation est homogène.</p>`,
          { rel: .01, calc: true, affiche: '1,50', diag: v => (Math.abs(v - 7.84e-4 * (7850 + 1260) * .29) < .01 ? 'C\'est la différence ρ<sub>S</sub> − ρ<sub>gly</sub>.' : 'η = C × (ρ<sub>S</sub> − ρ<sub>gly</sub>) × Δt.') }),
      ] },
    /* ---------- Sujet de bac ---------- */
    { id: '20', groupe: 'bac', titre: 'Sujet de bac : vol d\'un parapente', desc: 'Projections de vecteurs, vol droit équilibré, coefficient de traînée',
      contexte: `<p>On étudie le vol d'un parapente et de son pilote assimilé à un point matériel G situé au centre de masse du système {pilote + parapente}. Un vol droit équilibré est un vol au cours duquel la trajectoire est rectiligne et <b>sans variation de vitesse</b>. L'air environnant est supposé immobile. On se demande s'il s'agit d'une voile d'école ou de compétition.</p>${FIG20}
        <p>Coordonnées de G obtenues après modélisation (x et y en mètres, t en secondes) : x(t) = 11,0 × t ; y(t) = −1,1 × t.</p>
        <p>Au cours du mouvement d'un corps dans un fluide, il apparaît deux forces de contact : la traînée ${V('T')}, de même direction que le vecteur vitesse mais de sens opposé ; la portance ${V('F', 'P')}, perpendiculaire au vecteur vitesse, dans le plan (xOy). Les forces qui s'appliquent sur le système sont le poids ${V('P')}, la traînée ${V('T')} et la portance ${V('F', 'P')}. La masse du système est m = 87,7 kg. Le parapentiste effectue un vol droit équilibré avec une vitesse v = (11 ± 1) ${MS} faisant un angle α = 5,7° par rapport à l'horizontale.</p>
        <p><b>Données</b> : g = 9,80 ${MS2} ; T = ½ ρ v<sup>2</sup> S C<sub>x</sub> avec ρ = 1,14 kg·m<sup>−3</sup> (masse volumique de l'air), S = 22,6 m<sup>2</sup> (surface de référence de la voile), C<sub>x</sub> coefficient de traînée sans unité ; valeurs de C<sub>x</sub> : corps profilé 0,04 ; semi-corps profilé 0,09 ; incertitude-type u(C<sub>x</sub>) = 2 × C<sub>x</sub> × u(v) / v ; accord avec une valeur de référence si |m<sub>mes</sub> − m<sub>réf</sub>| / u(m) ≤ 3 (un seul chiffre significatif).</p>`,
      parties: [
        gabarit('1. Composantes du vecteur vitesse (en m·s<sup>−1</sup>) :', '', ['v<sub>x</sub> = ', { v: 11, tol: .01, affiche: '11,0' }, ' ; v<sub>y</sub> = ', { v: -1.1, tol: .01, affiche: '−1,1' }],
          `<p>${V('v')} = d${V('OG')}/dt : v<sub>x</sub>(t) = 11,0 ${MS} ; v<sub>y</sub>(t) = −1,1 ${MS}.</p>`, { diag: v => (v[1] === 1.1 ? 'y diminue : v<sub>y</sub> est négative.' : 'On dérive x(t) et y(t) par rapport au temps.') }),
        nombre('Valeur de la vitesse :', 'v =', Math.hypot(11, 1.1), MS, calc(`v = √(v<sub>x</sub><sup>2</sup> + v<sub>y</sub><sup>2</sup>) = √(11,0<sup>2</sup> + (−1,1)<sup>2</sup>) = ${c(`11 ${MS}`)}`), { rel: .01, calc: true, affiche: '11,05', diag: v => (Math.abs(v - 12.1) < .05 ? 'v = √(v<sub>x</sub>² + v<sub>y</sub>²), pas la somme.' : '') }),
        nombre('Valeur de la vitesse en km·h<sup>−1</sup> :', 'v =', Math.hypot(11, 1.1) * 3.6, 'km·h<sup>−1</sup>', calc(`v = 11,05 × 3,6 = 39,8 ≈ ${c('40 km·h<sup>−1</sup>')}`), { rel: .02, calc: true, affiche: '39,8', diag: v => (Math.abs(v - 3.07) < .05 ? 'Des m/s aux km/h, on multiplie par 3,6.' : '') }),
        choix('2. Nature du mouvement et vecteur accélération :', [['ok', `les composantes de ${V('v')} sont constantes : rectiligne uniforme, ${V('a')} = ${NUL}`], ['acc', 'rectiligne uniformément accéléré'], ['circ', `rectiligne uniforme, mais ${V('a')} ≠ ${NUL}`]], 'ok',
          `<p>Les composantes de ${V('v')} sont indépendantes du temps, donc ${V('v')} est constant : le mouvement est rectiligne et uniforme, et ${V('a')} = d${V('v')}/dt = ${NUL}.</p>`),
        nombre('3. Angle de plané α :', 'α =', Math.atan(1.1 / 11) * 180 / Math.PI, '°', calc(`tan α = |v<sub>y</sub>| / v<sub>x</sub> ; α = arctan(1,1 / 11,0) = ${c('5,7°')}`), { rel: .02, calc: true, affiche: '5,7' }),
        complexe({ q: '4. et 5. À l\'aide de la deuxième loi de Newton, détermine le coefficient de traînée C<sub>x</sub> de la voile (question complexe : essaie d\'abord seul).',
          label: 'C<sub>x</sub> =', unite: '', valeur: 2 * 87.7 * 9.80 * Math.sin(rad(5.7)) / (1.14 * 121 * 22.6), rel: .04, affiche: .055,
          diag: v => (Math.abs(v - 2 * 87.7 * 9.8 * Math.cos(rad(5.7)) / (1.14 * 121 * 22.6)) < .02 ? 'Le long de la trajectoire, la composante du poids est P sin α, pas P cos α.' : 'Commence par la deuxième loi de Newton avec <span class="vec-nom">a</span> = <span class="vec-nom">0</span>, projetée sur l\'axe de la trajectoire.'),
          reflexe: 'Réflexe : vol droit équilibré, donc <span class="vec-nom">a</span> = <span class="vec-nom">0</span> ; écris la deuxième loi de Newton, puis projette-la sur l\'axe de la trajectoire.',
          etapes: [
            choix('Étape 1. Deuxième loi de Newton :', [['ok', `${V('P')} + ${V('T')} + ${V('F', 'P')} = m ${V('a')} = ${NUL}`], ['ma', `${V('P')} + ${V('T')} + ${V('F', 'P')} = m ${V('a')} ≠ ${NUL}`], ['p', `${V('P')} = ${V('T')}`]], 'ok', `<p>${SFX} = m ${V('a')} et ${V('a')} = ${NUL} (vol droit équilibré) : ${V('P')} + ${V('T')} + ${V('F', 'P')} = ${NUL}.</p>`),
            choix('Étape 2. Projection sur l\'axe Ox\' de la trajectoire (vers l\'avant) :', [['ok', 'P sin α − T + 0 = 0, donc T = m g sin α'], ['cos', 'P cos α − T = 0, donc T = m g cos α'], ['p', 'P − T = 0, donc T = m g']], 'ok',
              '<p>P<sub>x\'</sub> + T<sub>x\'</sub> + F<sub>P,x\'</sub> = m a<sub>x\'</sub> : P sin α − T + 0 = 0 (la portance est perpendiculaire à la trajectoire). Donc <b>T = m g sin α</b>.</p>', { indices: { cos: 'L\'angle entre le poids et la normale à la trajectoire vaut α : le long de la trajectoire, c\'est P sin α.' } }),
            nombre('Étape 3. Valeur de la traînée :', 'T =', 87.7 * 9.80 * Math.sin(rad(5.7)), 'N', calc(`T = m g sin α = 87,7 × 9,80 × sin 5,7° = ${c('85,4 N')}`), { rel: .02, calc: true, affiche: '85,4' }),
            nombre('Étape 4. Coefficient de traînée (T = ½ ρ v² S C<sub>x</sub>) :', 'C<sub>x</sub> =', 2 * 87.7 * 9.80 * Math.sin(rad(5.7)) / (1.14 * 121 * 22.6), '', calc(`C<sub>x</sub> = 2 m g sin α / (ρ v<sup>2</sup> S) = 2 × 87,7 × 9,80 × sin 5,7° / (1,14 × 11<sup>2</sup> × 22,6) = ${c('5,5 × 10<sup>−2</sup>')}`), { rel: .04, calc: true, affiche: '0,055' }),
          ],
          correction: `<p>${REDAC('terrestre', 'le système')} Vol droit équilibré : ${V('a')} = ${NUL}, donc ${V('P')} + ${V('T')} + ${V('F', 'P')} = ${NUL}. Projection sur l'axe de la trajectoire : P sin α − T + 0 = 0, soit <b>T = m g sin α</b>.</p>
            ${calc(`½ ρ v<sup>2</sup> S C<sub>x</sub> = m g sin α ⟺ C<sub>x</sub> = 2 m g sin α / (ρ v<sup>2</sup> S) = 2 × 87,7 × 9,80 × sin 5,7° / (1,14 × 11<sup>2</sup> × 22,6) = ${c('5,5 × 10<sup>−2</sup>')}`)}
            <p>Unités : kg·m·s<sup>−2</sup> / (kg·m<sup>−3</sup>·m<sup>2</sup>·s<sup>−2</sup>·m<sup>2</sup>) : sans unité.</p>` }),
        nombre('5. (suite) Incertitude-type u(C<sub>x</sub>) = 2 × C<sub>x</sub> × u(v) / v, avec u(v) = 1 m·s<sup>−1</sup> (un chiffre significatif, arrondi par excès) :', 'u(C<sub>x</sub>) =', .01, '',
          `${calc('u(C<sub>x</sub>) = 2 × 5,5 × 10<sup>−2</sup> × (1 / 11) = 9,97 × 10<sup>−3</sup>')}<p>On garde un seul chiffre significatif, arrondi par excès : ${c('u(C<sub>x</sub>) = 0,01')}. L'incertitude porte sur les centièmes : C<sub>x</sub> = 0,05 ± 0,01.</p>`, { rel: .05, calc: true }),
        choix('6. Forme de la voile :', [['prof', 'corps profilé (C<sub>x</sub> = 0,04)'], ['semi', 'semi-corps profilé (C<sub>x</sub> = 0,09)']], 'prof', '<p>C<sub>x</sub> = 0,05 ± 0,01 est très proche de la valeur d\'un corps profilé (0,04) : la voile est profilée.</p>'),
        nombre('Quotient |C<sub>x,mes</sub> − C<sub>x,réf</sub>| / u(C<sub>x</sub>) :', 'z =', 1, '', `${calc(`z = |0,05 − 0,04| / 0,01 = ${c('1')}`)}<p>z = 1 ≤ 3 : la mesure est en accord avec la valeur de référence.</p>`, { tol: .3 }),
      ] },
  ];

  const GROUPES = [{ id: 'bilan', titre: 'Bilans des forces' }, { id: 'vecteurs', titre: 'Vecteurs et centre de masse' }, { id: 'calculs', titre: 'Deuxième loi de Newton : calculs' },
    { id: 'inertie', titre: 'Principe d\'inertie et référentiels' }, { id: 'analyse', titre: 'Analyse du mouvement' }, { id: 'fluide', titre: 'Chute dans un fluide' }, { id: 'bac', titre: 'Sujet de bac' }];

  LN.EXERCICES = EXERCICES;
  LN.GROUPES_EX = GROUPES;
  LN.complexe = complexe;
})();
