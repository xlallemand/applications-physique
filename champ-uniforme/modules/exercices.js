/* ============================================================
   Exercices du module 6 (application « Mouvement dans un champ
   uniforme ») : les exercices 1 à 16 de la feuille, même ordre, même
   numérotation (1, 1 bis, 2, 2 bis, 3…).

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML),
   parties: [p] } ; chaque partie suit le format de CU.PARTIES
   (modules/cu.js) avec p.q (question) et p.correction (correction
   détaillée, toujours disponible). Ex. 3 : vecteurs tracés dans un
   repère quadrillé (VEC, cinematique/modules/vecteurs.js).
   Ex. 16 : question complexe (date t_B) proposée telle quelle, puis par
   étapes sur demande (« Je ne sais pas par où commencer »), voir
   complexe() dans ce fichier.

   Valeurs vérifiées par un script. Écarts avec les corrections :
     ex. 4 à 7 : l'énoncé ne donne pas g ; la correction prend
       g = 10 N·kg⁻¹ : on l'écrit dans l'énoncé ; ex. 6 : un étage
       compté 3 m (comme la correction) ;
     ex. 5 : v = 32,0 m·s⁻¹ (la correction écrit 32,1, en reprenant des
       valeurs arrondies) ;
     ex. 13 f : la correction écrit « E devra être plus grand » ; or
       E = m v₁ / (q t₁) et m(Mg²⁺) < m(Pb²⁺) : E doit être plus FAIBLE ;
     ex. 14 : m = 9,14 × 10⁻³¹ kg, écart relatif 0,4 % (la correction
       écrit 9,16 dans le calcul de l'écart et 0,3 %) ;
     ex. 15 : sur Saturne, d = 72,28 × 9,81 / 11,50 = 61,7 m (la
       correction trouve 61,6 m avec v₀ arrondie) ;
     ex. 16 : t_B = 2 v_A sin α / g = 22,4 s (la correction écrit 22,3 s).
   ============================================================ */
(function () {
  'use strict';
  const CU = window.CU;
  const { o, fmt, cs, sci, V, col, sys, fr, rac, MS, MS2, VM, svg, fl, nom, txt, COUL, ENCRE, ENCRE2, ENCRE3, figTir, condo, integ, aide6 } = CU;
  const calc = h => `<p class="ph-calc">${h}</p>`;
  const c_ = h => `<span class="c">${h}</span>`;
  const t2 = 't<sup>2</sup>';
  const REDAC = sys => `Dans le référentiel terrestre supposé galiléen, pour ${sys} de masse constante, d'après la seconde loi de Newton, m ${V('a')} = Σ ${V('F', 'ext')}`;
  // fabriques de parties
  const choix = (q, options, bonne, correction, opts) => Object.assign({ type: 'choix', q, options: options.map(x => o(x[0], x[1])), bonne, correction, melanger: false, colonne: options.some(x => x[1].replace(/<[^>]+>/g, '').length > 22) }, opts);
  const nombre = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'nombre', q, label, valeur, unite, correction, signe: false, rel: .02, calc: true }, opts);
  const scient = (q, label, valeur, unite, correction, opts) => Object.assign({ type: 'sci', q, label, valeur, unite, correction, cs: 2, rel: .03, calc: true }, opts);

  /* ---------- figures ---------- */
  // schéma des ex. 1, 1 bis, 2, 2 bis : balle à la hauteur h, repère (haut : y vers le haut, origine au sol ;
  // bas : y vers le bas, origine au point de départ), vitesse initiale éventuelle (angle α)
  function schema(o2) {
    const W = 300, H = 170, xb = 70, yb = 50, yS = 150;
    let s = `<line x1="10" y1="${yS}" x2="${W - 10}" y2="${yS}" stroke="${ENCRE2}" stroke-width="1.5"/>`;
    for (let x = 16; x < W - 10; x += 12) s += `<line x1="${x}" y1="${yS + 1}" x2="${x - 7}" y2="${yS + 8}" stroke="${ENCRE3}"/>`;
    s += `<line x1="${xb - 26}" y1="${yb}" x2="${xb - 26}" y2="${yS}" stroke="${ENCRE2}"/><path d="M${xb - 30},${yb + 6} l4,-6 l4,6 M${xb - 30},${yS - 6} l4,6 l4,-6" fill="none" stroke="${ENCRE2}"/>` + txt(xb - 36, (yb + yS) / 2 + 4, 'h', { g: 800, c: ENCRE, t: 13, a: 'end' });
    s += `<circle cx="${xb}" cy="${yb}" r="6" fill="#fff" stroke="${ENCRE}" stroke-width="1.6"/>`;
    if (o2.angle) { s += fl(xb, yb, xb + 44 * Math.cos(.6), yb - 44 * Math.sin(.6), COUL.v, { ep: 2.2 }) + nom(xb + 46, yb - 30, 'v', '0', COUL.v, { t: 12 }) + `<path d="M${xb + 22},${yb} A22,22 0 0 0 ${xb + 22 * Math.cos(.6)},${yb - 22 * Math.sin(.6)}" fill="none" stroke="${ENCRE2}"/>` + txt(xb + 26, yb - 4, 'α', { t: 11 }); }
    const xo = 170;
    if (o2.bas) {
      s += fl(xo, yb, xo + 60, yb, ENCRE, { ep: 1.3, lt: 7 }) + fl(xo, yb, xo, yS + 4, ENCRE, { ep: 1.3, lt: 7 }) + txt(xo - 6, yb - 6, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(xo + 62, yb - 6, 'x', { g: 800, c: ENCRE, t: 12 }) + txt(xo + 8, yS - 2, 'y', { g: 800, c: ENCRE, t: 12 });
      s += `<line x1="${xo - 4}" y1="${yS}" x2="${xo + 4}" y2="${yS}" stroke="${ENCRE}" stroke-width="1.5"/>` + txt(xo - 7, yS - 4, 'h', { g: 800, c: ENCRE, t: 11, a: 'end' });
    } else {
      s += fl(xo, yS, xo + 60, yS, ENCRE, { ep: 1.3, lt: 7 }) + fl(xo, yS, xo, yb - 14, ENCRE, { ep: 1.3, lt: 7 }) + txt(xo - 6, yS + 14, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(xo + 62, yS - 6, 'x', { g: 800, c: ENCRE, t: 12 }) + txt(xo + 8, yb - 8, 'y', { g: 800, c: ENCRE, t: 12 });
      s += `<line x1="${xo - 4}" y1="${yb}" x2="${xo + 4}" y2="${yb}" stroke="${ENCRE}" stroke-width="1.5"/>` + txt(xo - 7, yb + 4, 'h', { g: 800, c: ENCRE, t: 11, a: 'end' });
    }
    s += fl(W - 24, 30, W - 24, 70, COUL.a, { ep: 2 }) + nom(W - 12, 58, 'g', '', COUL.a, { t: 12 });
    return svg(W, H, s, `Balle à la hauteur h${o2.angle ? ', lancée avec une vitesse faisant l\'angle alpha avec l\'horizontale' : ', lâchée sans vitesse'} ; repère : axe y ${o2.bas ? 'vers le bas, origine au point de départ' : 'vers le haut, origine au sol'}`);
  }
  // condensateur aux armatures verticales (ex. 10 et 12) : particule entrant à gauche
  function plaquesV(o2) {
    const W = 300, H = 150, xa = 70, xb = 210, ya = 75;
    let s = '';
    [xa, xb].forEach(x => { s += `<rect x="${x - 3}" y="14" width="6" height="52" rx="2" fill="#ebe8e1" stroke="${ENCRE2}"/><rect x="${x - 3}" y="84" width="6" height="52" rx="2" fill="#ebe8e1" stroke="${ENCRE2}"/>`; });
    s += fl(40, ya, 280, ya, ENCRE, { ep: 1.2, lt: 7 }) + txt(280, ya - 7, 'x', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(xa - 6, ya + 16, o2.nomO || 'O', { g: 800, c: ENCRE, t: 12, a: 'end' });
    if (o2.noms) s += txt(xa - 10, 24, o2.noms[0], { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(xb + 10, 24, o2.noms[1], { g: 800, c: ENCRE, t: 12 });
    if (o2.E) s += fl(110, 112, 170, 112, COUL.E, { ep: 2.2 }) + nom(140, 104, 'E', '', COUL.E, { t: 12 });
    if (o2.v0) s += fl(xa, ya - 10, xa + 40, ya - 10, COUL.v, { ep: 2.2 }) + nom(xa + 22, ya - 18, 'v', '0', COUL.v, { t: 12 });
    if (o2.d) s += `<line x1="${xa}" y1="8" x2="${xb}" y2="8" stroke="${ENCRE2}" stroke-dasharray="3 3"/>` + txt((xa + xb) / 2, 6, o2.d, { g: 800, c: ENCRE, t: 11, a: 'middle' });
    return svg(W, H, s, o2.aria || 'Condensateur plan aux armatures verticales, axe x horizontal');
  }
  // ex. 16 : vol parabolique de A à B
  function parabole() {
    const W = 300, H = 160;
    let s = fl(30, 140, 290, 140, ENCRE, { ep: 1.2, lt: 7 }) + fl(30, 140, 30, 10, ENCRE, { ep: 1.2, lt: 7 }) + txt(286, 132, 'x', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(36, 18, 'z', { g: 800, c: ENCRE, t: 12 }) + txt(24, 154, 'O', { g: 800, c: ENCRE, t: 12, a: 'end' });
    s += `<path d="M60,90 Q160,-10 260,90" fill="none" stroke="${COUL.traj}" stroke-width="2.2" stroke-dasharray="6 4"/><line x1="60" y1="90" x2="260" y2="90" stroke="${ENCRE3}" stroke-dasharray="3 3"/>`;
    s += fl(60, 90, 90, 56, COUL.v, { ep: 2.4 }) + nom(98, 54, 'v', 'A', COUL.v, { t: 12 }) + fl(260, 90, 290, 124, COUL.v, { ep: 2.4 }) + nom(282, 104, 'v', 'B', COUL.v, { t: 12 });
    s += txt(52, 94, 'A', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(252, 84, 'B', { g: 800, c: ENCRE, t: 12, a: 'end' }) + txt(82, 86, 'α', { t: 11 }) + txt(268, 86, 'α', { t: 11 });
    return svg(W, H, s, 'Vol parabolique : l\'avion part de A avec une vitesse inclinée de alpha vers le haut et arrive en B, à la même altitude, avec une vitesse inclinée de alpha vers le bas');
  }

  /* ---------- ex. 3 : tracer des vecteurs sur la trajectoire (VEC) ---------- */
  // trajectoire z = x (8 − x) / 4 ; échelle des vitesses : vₓ = 2 carreaux, constante
  function partieVecteurs() {
    const zx = x => x * (8 - x) / 4;
    return { type: 'perso', q: `Sur le quadrillage, ${V('v')}(O) et ${V('a')}(O) sont tracés. Trace ${V('v')}(A), ${V('v')}(C) et ${V('a')}(C) (glisse la pointe depuis le point, ou utilise les flèches), puis valide.`,
      correction: `<p>v<sub>x</sub> est constante (2 carreaux) ; v<sub>z</sub> diminue : 4 carreaux en O, 2 en A, 0 au sommet B, −2 en C (C est le symétrique de A : v<sub>z</sub>(C) = −v<sub>z</sub>(A)). L'accélération est toujours la même : ${V('a')} = ${V('g')}, verticale vers le bas.</p>`,
      monter(zone, api) {
        const rep = new window.VEC.Repere(zone, { xmin: -1, xmax: 9, ymin: -3, ymax: 6, axes: true, nomY: 'z', unitaires: false, mode: 'mixte',
          points: [{ nom: 'O', x: 0, y: 0, dx: -12, dy: 14 }, { nom: 'A', x: 2, y: 3, dx: -14, dy: -4 }, { nom: 'B', x: 4, y: 4, dx: -4, dy: -8 }, { nom: 'C', x: 6, y: 3, dx: 8, dy: -6 }, { nom: 'D', x: 7, y: 1.75, dx: 8, dy: 0 }],
          extra: g => { let d = ''; for (let k = 0; k <= 64; k++) { const x = -.05 + 8.3 * k / 64; d += `${k ? 'L' : 'M'}${g.px(x).toFixed(1)},${g.py(zx(x)).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="#0a7d57" stroke-width="2"/>`; },
          aria: 'Trajectoire parabolique passant par O, A, B (sommet), C et D ; vecteurs à tracer en A et en C',
          vecteurs: [{ nom: 'v_O', dep: [0, 0], coord: [2, 4], fixe: true, coul: COUL.v }, { nom: 'a_O', dep: [0, 0], coord: [0, -2], fixe: true, coul: COUL.a },
            { nom: 'v_A', dep: [2, 3], coord: [2, 2] }, { nom: 'v_C', dep: [6, 3], coord: [2, -2] }, { nom: 'a_C', dep: [6, 3], coord: [0, -2] }] });
        const bVal = CU.boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const res = rep.verifier();
          if (res.some(r => r.code === 'vide')) { api.message('Trace les trois vecteurs avant de valider.'); return; }
          if (res.every(r => r.code === 'ok')) { bVal.fermer(); api.reussi(); return; }
          const faux = res.filter(r => r.code !== 'ok').map(r => r.v.nom);
          api.erreur((faux.includes('a_C') ? `${V('a')}(C) est le même vecteur que ${V('a')}(O) : ${V('a')} = ${V('g')} partout. ` : '') +
            (faux.includes('v_A') || faux.includes('v_C') ? `v<sub>x</sub> ne change pas (2 carreaux, comme en O) ; v<sub>z</sub> diminue régulièrement : 4 carreaux en O, 0 au sommet B, et C est symétrique de A.` : ''));
        };
        return { montrer() { rep.montrer(); bVal.fermer(); } };
      } };
  }

  /* ---------- question complexe (ex. 16) ----------
     p = { q, label, valeur, rel, unite, diag, etapes: [parties], reflexe } : la question telle quelle,
     puis, sur demande, les étapes ; demander les étapes compte comme une erreur. */
  function complexe(p) {
    return Object.assign({ type: 'perso', monter(zone, api) {
      const d = document.createElement('div');
      d.className = 'cu-complexe';
      d.innerHTML = `<div class="ph-valeur"><span class="ph-lab">${p.label}</span><span data-ch></span><span class="ph-unite">${p.unite}</span>${CU.CALC}</div>
        <div class="er-actions"><button type="button" class="btn-primary" data-v>Valider</button><button type="button" class="btn-secondary" data-e>Je ne sais pas par où commencer</button></div>
        <div class="cu-complexe-etapes" hidden></div>`;
      zone.appendChild(d);
      const ch = CU.champ({ signe: false });
      d.querySelector('[data-ch]').appendChild(ch.el);
      const bV = d.querySelector('[data-v]'), bE = d.querySelector('[data-e]'), et = d.querySelector('.cu-complexe-etapes');
      const finir = () => { ch.desactiver(true); bV.disabled = true; bE.disabled = true; };
      bV.onclick = () => {
        if (api.fini()) return;
        const v = CU.lire(ch.input.value);
        if (isNaN(v)) { api.message('Écris un nombre (avec une virgule si besoin).'); return; }
        if (CU.proche(v, p.valeur, p.rel)) { finir(); et.hidden = true; api.reussi(); return; }
        api.erreur((p.diag && p.diag(v)) || 'Vérifie ton raisonnement, ou demande les étapes.');
      };
      bE.onclick = () => {
        if (api.fini() || !et.hidden) return;
        api.compterErreur();
        et.hidden = false; bE.disabled = true;
        et.innerHTML = `<p class="ph-msg">${p.reflexe}</p><div></div>`;
        CU.question(et.lastElementChild, { parties: p.etapes.map(x => Object.assign({}, x)) }, { fin() { finir(); api.reussi(); } }, 'exercice');
      };
      return { montrer() { ch.input.value = CU.fmt(p.affiche || p.valeur); finir(); et.hidden = true; } };
    } }, p);
  }

  /* ---------- parties communes des chutes libres ---------- */
  const BILAN_P = choix('Bilan des forces : la balle est soumise…', [['p', 'à son poids seulement'], ['pa', 'à son poids et à la force de lancer'], ['r', 'à son poids et aux frottements de l\'air']], 'p',
    `<p>Chute libre : frottements négligés ; la main n'agit plus après le lancer. Σ ${V('F', 'ext')} = ${V('P')} = m ${V('g')}.</p>`, { indices: { pa: 'Une fois lâchée, la balle n\'est plus en contact avec la main.', r: 'Chute libre : on néglige l\'air.' } });
  const accel = haut => choix(`Coordonnées de l'accélération (axe y ${haut ? 'vers le haut' : 'vers le bas'}) :`, [['h', 'a<sub>x</sub> = 0 ; a<sub>y</sub> = −g'], ['b', 'a<sub>x</sub> = 0 ; a<sub>y</sub> = g'], ['x', 'a<sub>x</sub> = −g ; a<sub>y</sub> = 0']], haut ? 'h' : 'b',
    `<p>${REDAC('la balle')} = m ${V('g')}, donc ${V('a')} = ${V('g')} : vertical, vers le bas, donc a<sub>y</sub> = ${haut ? '−g (axe vers le haut)' : '+g (axe vers le bas)'}.</p>`, { indice: `${V('g')} est vertical, vers le bas ; compare avec le sens de l'axe y.` });

  /* ============================================================
     LES EXERCICES
     ============================================================ */
  const G10 = '<p class="ph-donnees">On prendra g = 10 N·kg<sup>−1</sup> (comme la correction) et on négligera les frottements de l\'air.</p>';
  const EXERCICES = [
    /* ---------- Chute libre ---------- */
    { id: '1', groupe: 'chute', titre: 'Chute libre', desc: 'Balle lâchée sans vitesse : équations horaires, durée de chute (y vers le haut)',
      contexte: `<p>On lâche une balle de masse m, sans vitesse initiale, d'une hauteur h. Établir les équations horaires de son mouvement puis la durée de la chute.</p>${schema({})}`,
      parties: [BILAN_P, accel(true),
        choix('En intégrant, coordonnées de la vitesse :', [['ok', 'v<sub>x</sub>(t) = 0 ; v<sub>y</sub>(t) = −g t'], ['c', 'v<sub>x</sub>(t) = 0 ; v<sub>y</sub>(t) = −g t + h'], ['p', 'v<sub>x</sub>(t) = 0 ; v<sub>y</sub>(t) = g t']], 'ok',
          integ('v', ['v<sub>x</sub>(t) = C<sub>1</sub>', 'v<sub>y</sub>(t) = −g t + C<sub>2</sub>'], ['C<sub>1</sub> = v<sub>x</sub>(0) = 0', 'C<sub>2</sub> = v<sub>y</sub>(0) = 0'], ['v<sub>x</sub>(t) = 0', 'v<sub>y</sub>(t) = −g t']), { indices: { c: 'h est la position initiale ; la vitesse initiale est nulle.', p: 'a<sub>y</sub> = −g.' } }),
        choix('En intégrant, coordonnées de la position :', [['ok', `x(t) = 0 ; y(t) = −½ g ${t2} + h`], ['s', `x(t) = 0 ; y(t) = −½ g ${t2}`], ['g', `x(t) = 0 ; y(t) = −g ${t2} + h`]], 'ok',
          integ('p', ['x(t) = C<sub>3</sub>', `y(t) = −${fr('1', '2')} g ${t2} + C<sub>4</sub>`], ['C<sub>3</sub> = x(0) = 0', 'C<sub>4</sub> = y(0) = h'], ['x(t) = 0', `y(t) = −${fr('1', '2')} g ${t2} + h`]), { indices: { s: 'À t = 0, la balle est à y = h (origine au sol).', g: 'Primitive de −g t : −½ g t².' } }),
        choix('Au bout de combien de temps la balle touche-t-elle le sol ?', [['ok', `t<sub>chute</sub> = ${rac(fr('2h', 'g'))}`], ['h', `t<sub>chute</sub> = ${rac(fr('h', 'g'))}`], ['s', `t<sub>chute</sub> = ${fr('2h', 'g')}`]], 'ok',
          `<p>La balle touche le sol, à y = 0 sur le schéma : y(t<sub>chute</sub>) = 0, soit −½ g t<sub>chute</sub><sup>2</sup> + h = 0 ⟺ t<sub>chute</sub><sup>2</sup> = ${fr('2h', 'g')} ⟺ t<sub>chute</sub> = ${rac(fr('2h', 'g'))}.</p>`, { indice: aide6('le sol', 'l\'origine est au sol, donc y(t<sub>chute</sub>) = 0'), indices: { h: 'Il y a un ½ dans y(t) : t² = 2h / g.', s: 'N\'oublie pas la racine carrée.' } })] },
    { id: '1 bis', groupe: 'chute', titre: 'Chute libre, autre repère', desc: 'La même situation avec l\'axe y vers le bas, origine au point de départ',
      contexte: `<p>Même situation que l'exercice 1, en changeant de repère : axe y vertical <b>vers le bas</b>, origine O au point de départ de la balle.</p>${schema({ bas: true })}`,
      parties: [accel(false),
        choix('Coordonnées de la vitesse :', [['ok', 'v<sub>x</sub>(t) = 0 ; v<sub>y</sub>(t) = g t'], ['m', 'v<sub>x</sub>(t) = 0 ; v<sub>y</sub>(t) = −g t']], 'ok', '<p>a<sub>y</sub> = g, v<sub>y</sub>(0) = 0 : v<sub>y</sub>(t) = g t (positive : la balle descend, dans le sens de l\'axe).</p>', { indice: 'L\'axe est maintenant vers le bas.' }),
        choix('Coordonnées de la position :', [['ok', `x(t) = 0 ; y(t) = ½ g ${t2}`], ['h', `x(t) = 0 ; y(t) = ½ g ${t2} + h`], ['m', `x(t) = 0 ; y(t) = −½ g ${t2} + h`]], 'ok',
          '<p>C<sub>4</sub> = y(0) = 0 : l\'origine est au point de départ.</p>', { indices: { h: 'L\'origine est au point de départ : y(0) = 0.', m: 'C\'est l\'équation dans le repère de l\'exercice 1.' } }),
        choix('Quelle équation traduit l\'arrivée au sol ?', [['ok', 'y(t<sub>chute</sub>) = h'], ['z', 'y(t<sub>chute</sub>) = 0'], ['v', 'v<sub>y</sub>(t<sub>chute</sub>) = 0']], 'ok',
          `<p>Sur le schéma, le sol est à y = h : ½ g t<sub>chute</sub><sup>2</sup> = h ⟺ t<sub>chute</sub> = ${rac(fr('2h', 'g'))}, la même durée qu'à l'exercice 1 (heureusement !).</p>`, { indice: aide6('le sol', 'dans ce repère, l\'axe y est vers le bas et l\'origine au point de départ'), indices: { z: 'y = 0 est le point de départ dans ce repère.', v: 'La vitesse n\'est pas nulle en arrivant au sol.' } })] },
    { id: '2', groupe: 'chute', titre: 'Chute libre avec un angle', desc: 'Balle lancée avec un angle α : équations horaires, trajectoire, durée de chute',
      contexte: `<p>On lance une balle de masse m, d'une hauteur h, avec une vitesse initiale de valeur v<sub>0</sub> faisant un angle α avec l'horizontale. Établir les équations horaires, l'équation de la trajectoire, puis la durée de la chute (axe y vers le haut, origine au sol).</p>${schema({ angle: true })}`,
      parties: [accel(true),
        choix('Coordonnées de la vitesse :', [['ok', 'v<sub>x</sub>(t) = v<sub>0</sub> cos α ; v<sub>y</sub>(t) = −g t + v<sub>0</sub> sin α'], ['inv', 'v<sub>x</sub>(t) = v<sub>0</sub> sin α ; v<sub>y</sub>(t) = −g t + v<sub>0</sub> cos α'], ['z', 'v<sub>x</sub>(t) = 0 ; v<sub>y</sub>(t) = −g t + v<sub>0</sub>']], 'ok',
          `<p>C<sub>1</sub> = v<sub>x</sub>(0) = v<sub>0</sub> cos α et C<sub>2</sub> = v<sub>y</sub>(0) = v<sub>0</sub> sin α (projection de ${V('v', '0')}).</p>`, { indices: { inv: 'Sur l\'axe horizontal (adjacent à α) : cos α.', z: 'La vitesse initiale a deux coordonnées non nulles.' } }),
        choix('Coordonnées de la position :', [['ok', `x(t) = (v<sub>0</sub> cos α) t ; y(t) = −½ g ${t2} + (v<sub>0</sub> sin α) t + h`], ['h', `x(t) = (v<sub>0</sub> cos α) t + h ; y(t) = −½ g ${t2} + (v<sub>0</sub> sin α) t`]], 'ok',
          '<p>C<sub>3</sub> = x(0) = 0 et C<sub>4</sub> = y(0) = h.</p>', { indice: 'La hauteur h est sur l\'axe vertical.' }),
        choix('Équation de la trajectoire :', [['ok', `y = −${fr('g', '2 (v<sub>0</sub> cos α)<sup>2</sup>')} x<sup>2</sup> + (tan α) x + h`], ['c', `y = −${fr('g', '2 v<sub>0</sub><sup>2</sup>')} x<sup>2</sup> + (tan α) x + h`], ['s', `y = −${fr('g', '2 (v<sub>0</sub> cos α)<sup>2</sup>')} x<sup>2</sup> + (sin α) x + h`]], 'ok',
          `<p>t = x / (v<sub>0</sub> cos α), que l'on remplace dans y(t) ; v<sub>0</sub> sin α / (v<sub>0</sub> cos α) = tan α.</p>`, { indices: { c: 'En remplaçant t par x / (v<sub>0</sub> cos α), le cos α reste au carré.', s: 'v<sub>0</sub> sin α × x / (v<sub>0</sub> cos α) = (tan α) x.' } }),
        choix('Durée de la chute : y(t) = 0 est une équation du second degré, de discriminant Δ = (v<sub>0</sub> sin α)<sup>2</sup> + 2gh. Quelle racine garder ?', [['ok', `t<sub>chute</sub> = ${fr('v<sub>0</sub> sin α + ' + CU.rac('Δ') + '', 'g')}`], ['m', `t<sub>chute</sub> = ${fr('v<sub>0</sub> sin α − ' + CU.rac('Δ') + '', 'g')}`]], 'ok',
          `<p>−½ g ${t2} + (v<sub>0</sub> sin α) t + h = 0 a deux racines ; (v<sub>0</sub> sin α − ${rac('Δ')}) / g est négative (${rac('Δ')} > v<sub>0</sub> sin α) : elle n'a pas de sens physique. On garde t<sub>chute</sub> = (v<sub>0</sub> sin α + ${rac('Δ')}) / g > 0.</p>`, { indice: `Une durée est positive : ${rac('Δ')} est plus grand que v<sub>0</sub> sin α.` })] },
    { id: '2 bis', groupe: 'chute', titre: 'Chute libre avec un angle, autre repère', desc: 'La même situation avec l\'axe y vers le bas, origine au point de lancer',
      contexte: `<p>Même situation que l'exercice 2, en changeant de repère : axe y vertical <b>vers le bas</b>, origine O au point de lancer.</p>${schema({ angle: true, bas: true })}`,
      parties: [choix('Coordonnées de la vitesse initiale :', [['ok', col('v<sub>0</sub> cos α', '−v<sub>0</sub> sin α')], ['p', col('v<sub>0</sub> cos α', 'v<sub>0</sub> sin α')]], 'ok', '<p>La balle part vers le haut, alors que l\'axe y est vers le bas : v<sub>y</sub>(0) = −v<sub>0</sub> sin α.</p>', { indice: 'Le lancer est vers le haut ; l\'axe y vers le bas.' }),
        choix('Coordonnées de la vitesse :', [['ok', 'v<sub>x</sub>(t) = v<sub>0</sub> cos α ; v<sub>y</sub>(t) = g t − v<sub>0</sub> sin α'], ['m', 'v<sub>x</sub>(t) = v<sub>0</sub> cos α ; v<sub>y</sub>(t) = −g t + v<sub>0</sub> sin α']], 'ok', '<p>a<sub>y</sub> = +g et C<sub>2</sub> = −v<sub>0</sub> sin α.</p>', { indice: 'Axe vers le bas : a<sub>y</sub> = +g.' }),
        choix('Coordonnées de la position :', [['ok', `x(t) = (v<sub>0</sub> cos α) t ; y(t) = ½ g ${t2} − (v<sub>0</sub> sin α) t`], ['h', `x(t) = (v<sub>0</sub> cos α) t ; y(t) = ½ g ${t2} − (v<sub>0</sub> sin α) t + h`]], 'ok', '<p>Origine au point de lancer : C<sub>3</sub> = C<sub>4</sub> = 0.</p>', { indice: 'y(0) = 0 dans ce repère.' }),
        choix('Équation de la trajectoire :', [['ok', `y = ${fr('g', '2 (v<sub>0</sub> cos α)<sup>2</sup>')} x<sup>2</sup> − (tan α) x`], ['m', `y = −${fr('g', '2 (v<sub>0</sub> cos α)<sup>2</sup>')} x<sup>2</sup> + (tan α) x`]], 'ok', '<p>On élimine t = x / (v<sub>0</sub> cos α) : les signes sont inversés par rapport à l\'exercice 2 (axe y retourné) et il n\'y a pas de h.</p>', { indice: 'Les signes suivent ceux de y(t).' }),
        choix('Arrivée au sol :', [['ok', 'y(t<sub>chute</sub>) = h, la même équation du second degré qu\'à l\'exercice 2'], ['z', 'y(t<sub>chute</sub>) = 0']], 'ok', '<p>½ g t² − (v<sub>0</sub> sin α) t = h ⟺ −½ g t² + (v<sub>0</sub> sin α) t + h = 0 : même durée de chute.</p>', { indice: aide6('le sol', 'dans ce repère, il est à y = h') })] },
    { id: '3', groupe: 'chute', titre: 'Vitesse et accélération sur une trajectoire', desc: 'Représenter les vecteurs vitesse et accélération en plusieurs points d\'une chute libre',
      contexte: '<p>La courbe représente la trajectoire d\'un point matériel lancé du point O avec une vitesse ' + V('v', '0') + ' et se déplaçant en chute libre. Représenter, aux positions O, A, B, C, les vecteurs vitesse et accélération du projectile, en rendant compte de l\'évolution de leur valeur.</p>',
      parties: [choix('Comment évolue la coordonnée horizontale v<sub>x</sub> de la vitesse ?', [['ok', 'elle est constante'], ['d', 'elle diminue jusqu\'au sommet'], ['z', 'elle est nulle au sommet']], 'ok', '<p>a<sub>x</sub> = 0 : v<sub>x</sub> = v<sub>0</sub> cos α, constante.</p>', { indices: { d: 'C\'est v<sub>z</sub> qui diminue.', z: 'Au sommet, c\'est v<sub>z</sub> qui s\'annule.' } }),
        choix('Et la coordonnée verticale v<sub>z</sub> ?', [['ok', 'elle diminue, s\'annule au sommet B, puis devient négative'], ['c', 'elle est constante'], ['a', 'elle augmente']], 'ok', '<p>v<sub>z</sub> = −g t + v<sub>0</sub> sin α ; v<sub>z</sub>(C) = −v<sub>z</sub>(A) car A et C sont symétriques.</p>', { indice: 'a<sub>z</sub> = −g.' }),
        partieVecteurs()] },
    { id: '4', groupe: 'chute', titre: 'Bille lancée horizontalement', desc: 'Du haut d\'un immeuble de 50 m, v₀ = 5,0 m·s⁻¹ horizontale : distance et vitesse au sol',
      contexte: `<p>On lance du haut d'un immeuble de h = 50 m une bille de masse m = 3 g avec une vitesse v<sub>0</sub> = 5,0 ${MS} horizontale.</p>${G10}${figTir({ h: 50, v0: 5, g: 10, aria: 'Bille lancée horizontalement du haut d\'un immeuble de 50 m' })}`,
      parties: [nombre('a) Durée de la chute (x(t) = v<sub>0</sub> t, y(t) = −½ g t² + h) :', 't<sub>chute</sub> =', Math.sqrt(10), 's',
          `<p>Repère : axe x horizontal, axe y vers le haut, origine au pied de l'immeuble. ${REDAC('la bille')} = m ${V('g')}, a<sub>x</sub> = 0, a<sub>y</sub> = −g ; v<sub>x</sub> = v<sub>0</sub>, v<sub>y</sub> = −g t ; x = v<sub>0</sub> t, y = −½ g t² + h.</p>${calc(`y(t<sub>chute</sub>) = 0 ⟺ t<sub>chute</sub> = ${rac(fr('2h', 'g'))} = ${rac(fr('2 × 50', '10'))} = ${c_('3,2 s')}`)}`,
          { diag: v => (Math.abs(v - Math.sqrt(5)) < .1 ? 't² = 2h / g : il manque le 2.' : aide6('le point de chute', 'le sol est à y = 0, donc y(t<sub>chute</sub>) = 0')) }),
        nombre('b) À quelle distance de l\'immeuble la bille tombe-t-elle ? (2 chiffres significatifs)', 'd =', 5 * Math.sqrt(10), 'm', calc(`d = x(t<sub>chute</sub>) = v<sub>0</sub> t<sub>chute</sub> = 5,0 × 3,16 = 15,8 m ≈ ${c_('16 m')}`), { diag: () => aide6('le point de chute', 'd est son abscisse, d = x(t<sub>chute</sub>) = v<sub>0</sub> t<sub>chute</sub>') }),
        nombre('c) Valeur de la vitesse en touchant le sol (2 chiffres significatifs) :', 'v =', Math.hypot(5, 10 * Math.sqrt(10)), MS,
          calc(`v<sub>x</sub> = 5,0 ${MS} ; v<sub>y</sub>(t<sub>chute</sub>) = −10 × 3,16 = −31,6 ${MS} ; v = ${rac('v<sub>x</sub><sup>2</sup> + v<sub>y</sub><sup>2</sup>')} = ${rac('5,0<sup>2</sup> + 31,6<sup>2</sup>')} = ${c_('32 ' + MS)}`), { diag: v => (Math.abs(v - 10 * Math.sqrt(10)) < .5 ? `Il faut aussi v<sub>x</sub> = v<sub>0</sub> : v = ${rac('v<sub>x</sub><sup>2</sup> + v<sub>y</sub><sup>2</sup>')}.` : `v<sub>x</sub> = v<sub>0</sub>, v<sub>y</sub>(t<sub>chute</sub>) = −g t<sub>chute</sub>, puis v = ${rac('v<sub>x</sub><sup>2</sup> + v<sub>y</sub><sup>2</sup>')}.`) })] },
    { id: '5', groupe: 'chute', titre: 'Bille lancée à 45°', desc: 'Même immeuble, v₀ = 5,0 m·s⁻¹ à 45° : second degré, distance, vitesse au sol',
      contexte: `<p>On lance du haut d'un immeuble de h = 50 m une bille de masse m = 3 g avec une vitesse v<sub>0</sub> = 5,0 ${MS} faisant un angle de 45° avec l'horizontale.</p>${G10}`,
      parties: [nombre('a) Durée de la chute (3 chiffres significatifs) :', 't<sub>chute</sub> =', 2.5 * Math.SQRT2 / 10 + Math.sqrt(12.5 + 1000) / 10, 's',
          `<p>x(t) = (v<sub>0</sub> cos α) t ; y(t) = −½ g t² + (v<sub>0</sub> sin α) t + h. Au sol, y = 0 :</p>${calc('−5 t² + 3,54 t + 50 = 0 ; Δ = 3,54² + 4 × 5 × 50 = 1 012,5')}${calc(`t<sub>1</sub> = (−3,54 − ${rac('Δ')}) / (2 × (−5)) = ${c_('3,54 s')} ; t<sub>2</sub> = −2,83 s, impossible physiquement`)}`,
          { rel: .01, diag: v => (Math.abs(v - 2.83) < .05 ? 'C\'est la valeur absolue de la racine négative : garde la racine positive.' : Math.abs(v - Math.sqrt(10)) < .05 ? 'La vitesse initiale verticale n\'est pas nulle : résous l\'équation du second degré.' : aide6('le point de chute', 'le sol est à y = 0 : résous −5 t² + (5,0 sin 45°) t + 50 = 0')) }),
        nombre('b) Distance du point de chute à l\'immeuble (3 chiffres significatifs) :', 'd =', 12.5, 'm', calc(`d = (v<sub>0</sub> cos α) t<sub>chute</sub> = 5,0 × cos 45° × 3,54 = ${c_('12,5 m')}`), { rel: .01, diag: () => aide6('le point de chute', 'd = x(t<sub>chute</sub>) = (v<sub>0</sub> cos α) t<sub>chute</sub>') }),
        nombre('c) Valeur de la vitesse en touchant le sol (2 chiffres significatifs) :', 'v =', Math.hypot(2.5 * Math.SQRT2, -10 * 3.5355 + 2.5 * Math.SQRT2), MS,
          `${calc(`v = ${rac('(v<sub>0</sub> cos α)<sup>2</sup> + (−g t<sub>chute</sub> + v<sub>0</sub> sin α)<sup>2</sup>')} = ${rac('3,54<sup>2</sup> + (−35,4 + 3,54)<sup>2</sup>')} = ${c_('32 ' + MS)}`)}<p>La même valeur qu'à l'exercice 4 : on le comprendra avec l'énergie.</p>`, { diag: () => `v<sub>x</sub> = v<sub>0</sub> cos α ; v<sub>y</sub>(t<sub>chute</sub>) = −g t<sub>chute</sub> + v<sub>0</sub> sin α ; v = ${rac('v<sub>x</sub><sup>2</sup> + v<sub>y</sub><sup>2</sup>')}.` })] },
    { id: '6', groupe: 'chute', titre: 'Une bille et une balle', desc: 'Lâchées du 10ᵉ étage : laquelle arrive en premier ? vitesses au sol',
      contexte: `<p>On fait tomber du haut d'un immeuble de 10 étages une bille de masse m = 3 g et une balle de masse m = 500 g. On néglige les frottements de l'air.</p>${G10}<p class="ph-donnees">On suppose qu'un étage mesure 3 m : h = 30 m.</p>`,
      parties: [choix('a) La balle touchera-t-elle le sol avant, en même temps, ou après la bille ?', [['ok', 'en même temps'], ['av', 'avant (elle est plus lourde)'], ['ap', 'après']], 'ok',
          `<p>Pour chaque objet, ${REDAC('l\'objet')} = m<sub>i</sub> ${V('g')}, donc ${V('a')}<sub>i</sub> = ${V('g')} : même accélération, mêmes conditions initiales, donc même mouvement.</p>`, { indices: { av: 'Le poids est plus grand, mais la masse aussi : a = g pour les deux.', ap: 'Sans air, la masse ne joue aucun rôle.' } }),
        nombre('b) Valeur de leur vitesse en arrivant au sol (2 chiffres significatifs) :', 'v =', Math.sqrt(600), MS,
          calc(`y(t<sub>chute</sub>) = 0 donne t<sub>chute</sub> = ${rac(fr('2h', 'g'))} = ${rac(fr('2 × 30', '10'))} = 2,45 s ; v<sub>y</sub>(t<sub>chute</sub>) = −g t<sub>chute</sub> = −10 × 2,45 = −24 ${MS} : ${c_('v = 24 ' + MS)} pour les deux`), { diag: v => (Math.abs(v - Math.sqrt(300)) < .5 ? 'y(t<sub>chute</sub>) = 0 donne t<sub>chute</sub><sup>2</sup> = 2h / g : il manque le 2.' : aide6('le sol', 'y(t<sub>chute</sub>) = 0 donne t<sub>chute</sub>, puis v<sub>y</sub>(t<sub>chute</sub>) = −g t<sub>chute</sub>')) })] },
    { id: '7', groupe: 'chute', titre: 'Balle de tennis', desc: 'Vitesse de lancer pour atteindre 10 m de hauteur',
      contexte: `<p>À quelle vitesse faudrait-il lancer (verticalement) une balle de tennis pour lui faire atteindre une hauteur de 10 m ?</p>${G10}`,
      parties: [choix('a) Comment traduire « la balle atteint sa hauteur maximale » ?', [['ok', 'v<sub>y</sub>(t<sub>max</sub>) = 0'], ['y', 'y(t<sub>max</sub>) = 0'], ['a', 'a<sub>y</sub> = 0']], 'ok', '<p>Au sommet, la balle s\'arrête avant de redescendre : v<sub>y</sub> = 0. On a aussi y(t<sub>max</sub>) = h.</p>', { indice: aide6('le sommet', 'la balle s\'y arrête avant de redescendre'), indices: { y: 'y = 0 : le point de départ.', a: 'a<sub>y</sub> = −g en permanence.' } }),
        nombre('b) Vitesse de lancer (2 chiffres significatifs) :', 'v<sub>0</sub> =', Math.sqrt(200), MS,
          `<p>v<sub>y</sub>(t) = −g t + v<sub>0</sub> et y(t) = −½ g t² + v<sub>0</sub> t. v<sub>y</sub>(t<sub>max</sub>) = 0 donne t<sub>max</sub> = v<sub>0</sub> / g ; y(t<sub>max</sub>) = h donne −½ v<sub>0</sub>² / g + v<sub>0</sub>² / g = h, soit ½ v<sub>0</sub>² / g = h :</p>${calc(`v<sub>0</sub> = ${rac('2 g h')} = ${rac('2 × 10 × 10')} = ${c_('14 ' + MS)}`)}<p>(Elle se trouve très vite avec l'énergie.)</p>`,
          { diag: v => (Math.abs(v - 10) < .3 ? 'v<sub>0</sub><sup>2</sup> = 2gh : il manque le 2.' : 'Exprime t<sub>max</sub> avec v<sub>y</sub> = 0, puis écris y(t<sub>max</sub>) = h.') })] },
    { id: '8', groupe: 'chute', titre: 'Le trébuchet', desc: 'Projectile de 130 kg lancé de H = 10 m : équations, trajectoire, vitesse pour atteindre le mur à 100 m',
      contexte: `<p>Le trébuchet est une machine de guerre du Moyen Âge. Lors de sa libération, le projectile (m = 130 kg) se trouve à une hauteur H = 10 m et est projeté avec une vitesse ${V('v', '0')} faisant un angle α avec l'horizontale. Intensité du champ de pesanteur : g = 10 ${MS2}. On néglige les frottements de l'air et la poussée d'Archimède ; ${V('g')} est parallèle à l'axe (Oz).</p>${figTir({ h: 10, v0: 12, alpha: 30, g: 10, axe: 'z', hTxt: 'H', aria: 'Projectile lancé de la hauteur H avec un angle alpha' })}`,
      parties: [nombre('a) Valeur du poids du projectile :', 'P =', 1300, 'N', `<p>${V('P')} : direction verticale, sens vers le bas, valeur P = m g = 130 × 10 = ${c_('1 300 N')}.</p>`, { calc: false, rel: .005, diag: () => 'P = m × g.' }),
        choix('b) Coordonnées de l\'accélération :', [['ok', 'a<sub>x</sub> = 0 ; a<sub>z</sub> = −g'], ['p', 'a<sub>x</sub> = 0 ; a<sub>z</sub> = g'], ['m', 'a<sub>x</sub> = 0 ; a<sub>z</sub> = −m g']], 'ok', `<p>${REDAC('le projectile')} = m ${V('g')}, donc ${V('a')} = ${V('g')} : a<sub>x</sub> = 0, a<sub>z</sub> = −g.</p>`, { indices: { p: 'L\'axe z est vers le haut, ' + V('g') + ' vers le bas.', m: 'm a = m g : la masse se simplifie.' } }),
        choix('c) Coordonnées v<sub>x</sub>(t) et v<sub>z</sub>(t) :', [['ok', 'v<sub>x</sub> = v<sub>0</sub> cos α ; v<sub>z</sub> = −g t + v<sub>0</sub> sin α'], ['inv', 'v<sub>x</sub> = −g t + v<sub>0</sub> cos α ; v<sub>z</sub> = v<sub>0</sub> sin α']], 'ok', '<p>On intègre, avec à t = 0 : C<sub>1</sub> = v<sub>0</sub> cos α, C<sub>2</sub> = v<sub>0</sub> sin α.</p>', { indice: 'Seule la coordonnée verticale est modifiée par g.' }),
        choix('d) Nature du mouvement en projection sur l\'axe horizontal :', [['ok', 'uniforme, car v<sub>x</sub> est constante'], ['acc', 'uniformément accéléré'], ['imm', 'immobile']], 'ok', '<p>Aucune force horizontale : v<sub>x</sub> = v<sub>0</sub> cos α, constante ; le mouvement horizontal est uniforme (principe d\'inertie en projection).</p>', { indices: { acc: 'a<sub>x</sub> = 0.', imm: 'v<sub>x</sub> = v<sub>0</sub> cos α n\'est pas nulle.' } }),
        choix('e) Équations horaires :', [['ok', `x(t) = (v<sub>0</sub> cos α) t ; z(t) = −½ g ${t2} + (v<sub>0</sub> sin α) t + H`], ['s', `x(t) = (v<sub>0</sub> cos α) t ; z(t) = −½ g ${t2} + (v<sub>0</sub> sin α) t`]], 'ok', '<p>x(0) = 0 et z(0) = H.</p>', { indice: 'Le projectile part de la hauteur H.' }),
        choix('f) Pour obtenir z = −(1/2) g x² / (v<sub>0</sub>² cos² α) + x tan α + H, on :', [['ok', 'exprime t = x / (v<sub>0</sub> cos α) et on le remplace dans z(t)'], ['d', 'dérive z(t)'], ['z', 'pose z = 0']], 'ok', '<p>On élimine t entre x(t) et z(t).</p>', { indices: { d: 'Dériver donnerait v<sub>z</sub>.', z: 'z = 0 donne le point de chute.' } }),
        choix('g) Quels paramètres de lancement jouent un rôle dans le mouvement ?', [['ok', 'v<sub>0</sub>, α et H'], ['m', 'la masse m, v<sub>0</sub> et α'], ['v', 'v<sub>0</sub> seulement']], 'ok', '<p>z(x) dépend de v<sub>0</sub>, α et H (et de g), pas de la masse.</p>', { indices: { m: 'La masse n\'apparaît pas dans l\'équation.', v: 'L\'angle et la hauteur comptent aussi.' } }),
        choix('h) Si ' + V('v', '0') + ' est horizontale, l\'abscisse du point de chute est :', [['ok', `x = v<sub>0</sub> ${rac(fr('2H', 'g'))}`], ['s', `x = v<sub>0</sub> ${rac(fr('H', 'g'))}`], ['g', `x = ${rac(fr('2H', 'g'))}`]], 'ok', '<p>α = 0 : cos α = 1, tan α = 0, z = −½ g x² / v<sub>0</sub>² + H. Au sol, z = 0 : x² = 2H v<sub>0</sub>² / g, donc x = v<sub>0</sub> ' + CU.rac('2H / g') + '.</p>', { indices: { s: 'N\'oublie pas le ½ : x² = 2H v<sub>0</sub>² / g.', g: 'C\'est la durée de chute, à multiplier par v<sub>0</sub>.' } }),
        nombre('i) Vitesse horizontale v<sub>0</sub> pour atteindre le mur à x = 100 m (3 chiffres significatifs) :', 'v<sub>0</sub> =', 100 * Math.sqrt(.5), MS, calc(`v<sub>0</sub> = x ${CU.rac('g / (2H)')} = 100 × ${CU.rac('10 / (2 × 10)')} = ${c_('70,7 ' + MS)}`), { rel: .005, diag: () => aide6('le mur', 'le projectile y touche le sol (z = 0) à x = 100 m : isole v<sub>0</sub> dans x = v<sub>0</sub> ' + CU.rac('2H / g')) })] },

    /* ---------- Particules chargées ---------- */
    { id: '9', groupe: 'charge', titre: 'Placer les vecteurs', desc: 'Particule positive dans un condensateur : E, accélération, allure de la trajectoire',
      contexte: `<p>Une particule chargée positivement entre dans un condensateur plan où règne un champ électrostatique uniforme ${V('E')}. Seul le vecteur vitesse initiale est représenté.</p><div class="cu-figs2">${condo({ haut: '−', q: 1, ang: 35, traj: false, E: false, U: false, nomA: 'A', nomB: 'B', aria: 'Figure a : armature A du haut négative, armature B du bas positive, vitesse initiale vers le haut et la droite' })}${condo({ haut: '+', q: 1, ang: 0, traj: false, E: false, U: false, nomA: 'A', nomB: 'B', aria: 'Figure b : armature A du haut positive, armature B du bas négative, vitesse initiale horizontale' })}</div><p class="ph-donnees">À gauche : figure a ; à droite : figure b.</p>`,
      parties: [choix('a) Figure a : sens de ' + V('E') + ' et de ' + V('a') + ' :', [['ok', V('E') + ' et ' + V('a') + ' vers le haut'], ['b', V('E') + ' et ' + V('a') + ' vers le bas'], ['op', V('E') + ' vers le haut, ' + V('a') + ' vers le bas']], 'ok', `<p>${V('E')} va de l'armature + (B, en bas) vers l'armature − (A, en haut) : vers le haut. q > 0 : ${V('a')} = q ${V('E')} / m a le même sens.</p>`, { indices: { b: V('E') + ' va de + vers −.', op: 'q > 0 : ' + V('a') + ' a le sens de ' + V('E') + '.' } }),
        choix('b) Figure a : allure de la trajectoire :', [['ok', 'une parabole qui se courbe vers l\'armature A (en haut)'], ['b', 'une parabole qui retombe vers B'], ['d', 'une droite']], 'ok', '<p>La particule positive est attirée par l\'armature − : elle monte de plus en plus vers A.</p>', { indice: 'La particule positive est attirée par l\'armature −.' }),
        choix('c) Figure b : sens de ' + V('a') + ' et allure de la trajectoire :', [['ok', V('a') + ' vers le bas ; parabole qui descend vers B'], ['h', V('a') + ' vers le haut ; parabole qui monte vers A'], ['d', 'pas d\'accélération ; droite']], 'ok', `<p>A est +, B est − : ${V('E')} vers le bas, ${V('a')} aussi ; la particule part horizontalement et se courbe vers B.</p>`, { indice: 'Où est l\'armature − sur la figure b ?' })] },
    { id: '10', groupe: 'charge', titre: 'Accélération d\'un proton', desc: 'Proton dans un accélérateur linéaire : force, équations horaires, durée, distance entre les armatures',
      contexte: `<p>Dans un accélérateur linéaire, un proton de charge e et de masse m = 1,7 × 10<sup>−27</sup> kg pénètre avec une vitesse initiale v<sub>0</sub> = 2,0 × 10<sup>3</sup> ${MS}, perpendiculaire aux armatures d'un condensateur plan où règne un champ uniforme E = 1,0 kV·m<sup>−1</sup>. Le poids est négligé. Sa vitesse finale doit être v<sub>f</sub> = 2 v<sub>0</sub>. Donnée : e = 1,60 × 10<sup>−19</sup> C.</p>${plaquesV({ E: true, v0: true, d: 'd' })}`,
      parties: [scient('1. a) Valeur de la force ' + V('F') + ' :', 'F =', 1.6e-16, 'N', `<p>${V('F')} = q ${V('E')} = e ${V('E')} : horizontale, vers la droite (comme ${V('E')}), de valeur</p>${calc(`F = e E = 1,60 × 10<sup>−19</sup> × 1,0 × 10<sup>3</sup> = ${c_('1,6 × 10<sup>−16</sup> N')}`)}`, { diag: () => 'F = e × E, avec E = 1,0 × 10<sup>3</sup> V·m<sup>−1</sup>.' }),
        choix('1. b) Projection de la seconde loi de Newton sur (Ox) :', [['ok', 'a<sub>x</sub> = e E / m'], ['m', 'a<sub>x</sub> = e E m'], ['g', 'a<sub>x</sub> = g']], 'ok', `<p>${REDAC('le proton')} = e ${V('E')}, donc ${V('a')} = e ${V('E')} / m, soit a<sub>x</sub> = e E / m (a<sub>y</sub> = a<sub>z</sub> = 0).</p>`, { indices: { m: 'm a = e E : on divise par m.', g: 'Le poids est négligé.' } }),
        choix('2. Quel est le mouvement du proton ?', [['ok', 'rectiligne uniformément accéléré'], ['u', 'rectiligne uniforme'], ['p', 'parabolique']], 'ok', '<p>Accélération constante, dans le sens de la vitesse : mouvement rectiligne uniformément accéléré. C\'est un accélérateur <b>linéaire</b> : il accélère le proton en ligne droite.</p>', { indices: { u: 'Une force non compensée agit.', p: V('a') + ' et ' + V('v', '0') + ' ont la même direction.' } }),
        choix('3. Équations horaires :', [['ok', `v(t) = ${fr('eE', 'm')} t + v<sub>0</sub> ; x(t) = ${fr('eE', '2m')} ${t2} + v<sub>0</sub> t`], ['s', `v(t) = ${fr('eE', 'm')} t ; x(t) = ${fr('eE', '2m')} ${t2}`]], 'ok', '<p>On intègre avec C<sub>1</sub> = v<sub>x</sub>(0) = v<sub>0</sub> et C<sub>2</sub> = x(0) = 0.</p>', { indice: 'Le proton entre avec la vitesse v<sub>0</sub>.' }),
        scient('4. a) À quel instant t<sub>f</sub> le proton atteint-il v<sub>f</sub> = 2 v<sub>0</sub> ?', 't<sub>f</sub> =', 1.7e-27 * 2e3 / 1.6e-16, 's', calc(`2 v<sub>0</sub> = (eE / m) t<sub>f</sub> + v<sub>0</sub> ⟺ t<sub>f</sub> = m v<sub>0</sub> / (e E) = 1,7 × 10<sup>−27</sup> × 2,0 × 10<sup>3</sup> / (1,60 × 10<sup>−19</sup> × 1,0 × 10<sup>3</sup>) = ${c_('2,1 × 10<sup>−8</sup> s')}`), { diag: () => 'Écris v(t<sub>f</sub>) = 2 v<sub>0</sub> et isole t<sub>f</sub> : t<sub>f</sub> = m v<sub>0</sub> / (eE).' }),
        scient('4. b) Distance d entre les deux armatures :', 'd =', 1.6e-16 / (2 * 1.7e-27) * Math.pow(2.125e-8, 2) + 2e3 * 2.125e-8, 'm', calc(`d = x(t<sub>f</sub>) = (eE / 2m) t<sub>f</sub>² + v<sub>0</sub> t<sub>f</sub> = ${c_('6,4 × 10<sup>−5</sup> m')}`), { diag: v => (Math.abs(v / 4.25e-5 - 1) < .05 ? 'N\'oublie pas le terme (eE / 2m) t<sub>f</sub>².' : 'd = x(t<sub>f</sub>).') })] },
    { id: '11', groupe: 'charge', titre: 'Déflexion électrique', desc: 'Électron dévié dans un condensateur : E, force et poids, équations, sortie',
      contexte: `<p>Une tension U<sub>AB</sub> est appliquée entre les armatures A (P, en haut) et B (N, en bas) d'un condensateur plan, séparées de d et de longueur L. Un électron arrive au point O dans la zone de champ uniforme avec une vitesse ${V('v', '0')} horizontale ; ${V('E')} est vertical vers le bas.</p>
        <p class="ph-donnees">U<sub>AB</sub> = 6,00 × 10<sup>2</sup> V ; v<sub>0</sub> = 2,00 × 10<sup>4</sup> km·s<sup>−1</sup> ; d = 6,0 cm ; L = 10,0 cm ; m = 9,1 × 10<sup>−31</sup> kg ; e = 1,60 × 10<sup>−19</sup> C ; g = 9,8 N·kg<sup>−1</sup>.</p>${condo({ haut: '+', q: -1, traj: false, nomA: 'P', nomB: 'N', aria: 'Électron entrant horizontalement en O entre l\'armature P du haut, positive, et N du bas' })}`,
      parties: [scient('a) Valeur du champ entre les armatures :', 'E =', 1e4, VM, calc(`E = U<sub>AB</sub> / d = 6,00 × 10<sup>2</sup> / 6,0 × 10<sup>−2</sup> = ${c_('1,0 × 10<sup>4</sup> ' + VM)}`), { diag: v => (Math.abs(v / 100 - 1) < .05 ? 'd en mètres : 6,0 cm = 6,0 × 10<sup>−2</sup> m.' : Math.abs(v / 6000 - 1) < .05 ? 'On divise par d (distance entre les armatures), pas par L.' : 'E = U / d.') }),
        scient('b) Valeur de la force électrique :', 'F<sub>e</sub> =', 1.6e-15, 'N', calc(`${V('F', 'e')} = −e ${V('E')} ; F<sub>e</sub> = e E = 1,60 × 10<sup>−19</sup> × 1,0 × 10<sup>4</sup> = ${c_('1,6 × 10<sup>−15</sup> N')}`), { diag: () => 'F<sub>e</sub> = e E.' }),
        choix('b) (suite) Poids : P = m g = 8,9 × 10<sup>−30</sup> N. Conclusion :', [['ok', 'le poids est négligeable (près de 10<sup>15</sup> fois plus faible)'], ['f', 'la force électrique est négligeable'], ['c', 'les deux forces se compensent']], 'ok', '<p>F<sub>e</sub> / P ≈ 1,8 × 10<sup>14</sup> : on néglige le poids.</p>', { indice: 'Compare 1,6 × 10<sup>−15</sup> et 8,9 × 10<sup>−30</sup>.' }),
        choix('c) Expression de l\'accélération :', [['ok', `${V('a')} = −${fr(`e ${V('E')}`, 'm')}`], ['p', `${V('a')} = ${fr(`e ${V('E')}`, 'm')}`], ['g', `${V('a')} = ${V('g')}`]], 'ok', `<p>${REDAC('l\'électron')} = −e ${V('E')}, donc ${V('a')} = −e ${V('E')} / m.</p>`, { indices: { p: 'La charge de l\'électron est −e.', g: 'Le poids est négligé.' } }),
        choix('d) Équation de la trajectoire (axe y vers le haut) :', [['ok', `y = ${fr('eE', '2m v<sub>0</sub><sup>2</sup>')} x<sup>2</sup>`], ['m', `y = −${fr('eE', '2m v<sub>0</sub><sup>2</sup>')} x<sup>2</sup>`], ['l', `y = ${fr('eE', 'm v<sub>0</sub>')} x`]], 'ok',
          `<p>${V('E')} ${col('0', '−E')} donc ${V('a')} ${col('0', 'eE / m')} ; v<sub>x</sub> = v<sub>0</sub>, v<sub>y</sub> = (eE / m) t ; x = v<sub>0</sub> t, y = (eE / 2m) t². Avec t = x / v<sub>0</sub> : y = eE x² / (2m v<sub>0</sub>²), une parabole tournée vers l'armature +. ${V('a')} est verticale, vers le haut, en tout point.</p>`, { indices: { m: 'L\'électron est attiré par l\'armature + (en haut).', l: 'Accélération constante non colinéaire à ' + V('v', '0') + ' : parabole.' } }),
        nombre('e) Ordonnée y<sub>S</sub> du point de sortie, en mm (2 chiffres significatifs) :', 'y<sub>S</sub> =', 1.6e-19 * 1e4 * .01 / (2 * 9.1e-31 * 4e14) * 1000, 'mm', calc(`y<sub>S</sub> = eE L² / (2m v<sub>0</sub>²) = 1,60 × 10<sup>−19</sup> × 1,0 × 10<sup>4</sup> × (10 × 10<sup>−2</sup>)² / (2 × 9,1 × 10<sup>−31</sup> × (2,00 × 10<sup>7</sup>)²) = 2,2 × 10<sup>−2</sup> m = ${c_('22 mm')}`),
          { rel: .03, diag: v => (Math.abs(v / (22 * 1e6) - 1) < .05 ? 'v<sub>0</sub> en m·s<sup>−1</sup> : 2,00 × 10<sup>4</sup> km·s<sup>−1</sup> = 2,00 × 10<sup>7</sup> m·s<sup>−1</sup>.' : aide6('le point de sortie S', 'il est au bout des armatures, x = L, donc y<sub>S</sub> = y(L), avec L = 0,100 m et v<sub>0</sub> = 2,00 × 10<sup>7</sup> m·s<sup>−1</sup>')) }),
        choix('f) Mouvement ultérieur :', [['ok', 'rectiligne uniforme'], ['p', 'parabolique'], ['c', 'circulaire']], 'ok', '<p>Hors du condensateur, plus de force électrique (poids négligeable) : principe d\'inertie, mouvement rectiligne uniforme.</p>', { indice: 'Quelle force reste-t-il hors du condensateur ?' })] },
    { id: '12', groupe: 'charge', titre: 'Accélérateur de Van de Graaff', desc: 'U = 4,0 MV, L = 7,62 m : champ, force, équations horaires, vitesse en B',
      contexte: `<p>Un des premiers accélérateurs de particules utilisait un générateur de Van de Graaff pour charger les armatures d'un condensateur plan avec une tension U = 4,0 MV. La distance entre les armatures était L = 7,62 m. Il accélérait des protons, introduits en A sans vitesse initiale.</p><p class="ph-donnees">m = 1,67 × 10<sup>−27</sup> kg ; e = 1,60 × 10<sup>−19</sup> C.</p>${plaquesV({ noms: ['A', 'B'], nomO: 'A' })}`,
      parties: [choix('a) Quelle armature est reliée à la borne positive du générateur ?', [['A', 'A'], ['B', 'B']], 'A', '<p>A : le proton, positif, doit être repoussé de A vers B (vers la droite).</p>', { indice: 'Le proton positif est repoussé par l\'armature +.' }),
        scient('b) Norme du champ électrique :', 'E =', 4e6 / 7.62, VM, calc(`E = U / L = 4,0 × 10<sup>6</sup> / 7,62 = ${c_('5,2 × 10<sup>5</sup> ' + VM)}`), { diag: v => (Math.abs(v / 4e6 - 1) < .05 ? 'Divise par L.' : 'E = U / L, avec U = 4,0 × 10<sup>6</sup> V.') }),
        scient('b) (suite) Norme de la force électrique subie par un proton :', 'F =', 1.6e-19 * 5.2e5, 'N', calc(`F = e E = 1,60 × 10<sup>−19</sup> × 5,2 × 10<sup>5</sup> = ${c_('8,4 × 10<sup>−14</sup> N')}`), { diag: () => 'F = e E.' }),
        choix('c) Sur le schéma, ' + V('E') + ' et ' + V('F') + ' sont :', [['ok', 'tous deux horizontaux, de A vers B'], ['op', V('E') + ' de B vers A, ' + V('F') + ' de A vers B']], 'ok', '<p>Le proton est positif : ' + V('F') + ' = e ' + V('E') + ' a le sens de ' + V('E') + ', de A (+) vers B (−). Échelles possibles : 1 cm pour 2 × 10<sup>5</sup> V·m<sup>−1</sup> (2,6 cm) et 1 cm pour 2 × 10<sup>−14</sup> N (4,2 cm).</p>', { indice: 'q > 0.' }),
        choix('d) Équations horaires :', [['ok', `v<sub>x</sub>(t) = ${fr('eE', 'm')} t ; x(t) = ${fr('eE', '2m')} ${t2}`], ['v', `v<sub>x</sub>(t) = ${fr('eE', 'm')} t + v<sub>0</sub> ; x(t) = ${fr('eE', '2m')} ${t2} + v<sub>0</sub> t`]], 'ok', `<p>Système : le proton ; bilan : ${V('F')} (poids négligé). ${REDAC('le proton')} = e ${V('E')} ; a<sub>x</sub> = eE / m ; v<sub>x</sub>(0) = 0 et x(0) = 0.</p>`, { indice: 'Introduits sans vitesse initiale.' }),
        scient('e) Vitesse atteinte en B :', 'v<sub>B</sub> =', Math.sqrt(2 * 1.6e-19 * 4e6 / 1.67e-27), MS,
          `<p>x(t<sub>B</sub>) = L donne t<sub>B</sub> = ${CU.rac('2mL / (eE)')} ; v<sub>B</sub> = (eE / m) t<sub>B</sub> = ${CU.rac('2eEL / m')} = ${CU.rac('2eU / m')} car E = U / L :</p>${calc(`v<sub>B</sub> = ${CU.rac('2 × 1,60 × 10<sup>−19</sup> × 4,0 × 10<sup>6</sup> / 1,67 × 10<sup>−27</sup>')} = ${c_('2,8 × 10<sup>7</sup> ' + MS)}`)}`, { diag: () => aide6('le point B', 'il est sur l\'armature B : x(t<sub>B</sub>) = L donne t<sub>B</sub>, puis v<sub>B</sub> = v<sub>x</sub>(t<sub>B</sub>)') }),
        choix('e) (suite) Cette vitesse dépend-elle de la distance entre les armatures ?', [['non', 'non'], ['oui', 'oui']], 'non', '<p>v<sub>B</sub> = ' + CU.rac('2eU / m') + ' : L n\'intervient pas.</p>', { indice: 'Regarde l\'expression de v<sub>B</sub>.' })] },
    { id: '13', groupe: 'charge', titre: 'Accélération d\'ions plomb', desc: 'Ions Pb²⁺ : accélération, équations horaires, champ nécessaire, distance, comparaison avec Mg²⁺',
      contexte: `<p>Des ions plomb Pb<sup>2+</sup> sont insérés sans vitesse initiale dans un accélérateur linéaire où règne un champ électrique ${V('E')} uniforme.</p><p class="ph-donnees">m = 3,44 × 10<sup>−25</sup> kg ; q = 3,20 × 10<sup>−19</sup> C.</p>`,
      parties: [choix('a) Expression de l\'accélération :', [['ok', `${V('a')} = ${fr(`q ${V('E')}`, 'm')}`], ['m', `${V('a')} = q m ${V('E')}`], ['g', `${V('a')} = ${V('g')} + ${fr(`q ${V('E')}`, 'm')}`]], 'ok', `<p>Système : l'ion plomb ; force électrique ${V('F', 'él')} = q ${V('E')} (poids négligé). ${REDAC('l\'ion')} = q ${V('E')}, donc ${V('a')} = q ${V('E')} / m.</p>`, { indices: { m: 'On divise par m.', g: 'Le poids est négligé.' } }),
        choix('b) Pour un mouvement rectiligne accéléré, ' + V('E') + ' doit être :', [['ok', 'dans le sens du mouvement'], ['op', 'opposé au mouvement'], ['p', 'perpendiculaire au mouvement']], 'ok', '<p>q > 0 : ' + V('a') + ' a le sens de ' + V('E') + ', qui doit être dans le sens du mouvement (armature + à l\'entrée).</p>', { indices: { op: 'L\'ion serait freiné, ou repoussé.', p: 'La trajectoire serait courbe.' } }),
        choix('c) Équations horaires :', [['ok', `v<sub>x</sub>(t) = ${fr('qE', 'm')} t ; x(t) = ${fr('qE', '2m')} ${t2}`], ['s', `v<sub>x</sub>(t) = ${fr('qE', '2m')} t ; x(t) = ${fr('qE', 'm')} ${t2}`]], 'ok', '<p>v<sub>x</sub>(0) = 0 et x(0) = 0.</p>', { indice: 'Primitive de A t : ½ A t².' }),
        nombre('d) Champ qui permet d\'atteindre v<sub>1</sub> = 3,0 × 10<sup>6</sup> ' + MS + ' en t<sub>1</sub> = 1,0 s (2 chiffres significatifs) :', 'E =', 3.44e-25 * 3e6 / 3.2e-19, VM, calc(`v<sub>1</sub> = (qE / m) t<sub>1</sub> ⟺ E = m v<sub>1</sub> / (q t<sub>1</sub>) = 3,44 × 10<sup>−25</sup> × 3,0 × 10<sup>6</sup> / (3,20 × 10<sup>−19</sup> × 1,0) = ${c_('3,2 ' + VM)}`), { rel: .03, diag: () => 'Isole E dans v<sub>1</sub> = (qE / m) t<sub>1</sub>.' }),
        scient('e) Distance parcourue à cet instant :', 'x =', 3e6 / 2, 'm', `${calc(`x(t<sub>1</sub>) = (qE / 2m) t<sub>1</sub>² = 3,20 × 10<sup>−19</sup> × 3,2 / (2 × 3,44 × 10<sup>−25</sup>) × 1,0² = ${c_('1,5 × 10<sup>6</sup> m')}`)}<p>1 500 km : impossible d'avoir un accélérateur de cette taille ! C'est la valeur t<sub>1</sub> = 1,0 s qui est absurde dans l'énoncé.</p>`, { diag: () => 'x = (qE / 2m) t<sub>1</sub>².' }),
        choix('f) Pour un ion magnésium Mg<sup>2+</sup> (même charge, masse plus faible), avec les mêmes v<sub>1</sub> et t<sub>1</sub> :', [['ok', 'il faut un champ plus faible ; la distance est la même'], ['fort', 'il faut un champ plus fort ; la distance est la même'], ['d', 'il faut le même champ ; la distance est plus courte']], 'ok',
          `<p>E = m v<sub>1</sub> / (q t<sub>1</sub>) est proportionnel à m : m(Mg<sup>2+</sup>) < m(Pb<sup>2+</sup>), donc E est plus faible. x = (qE / 2m) t<sub>1</sub>² = v<sub>1</sub> t<sub>1</sub> / 2 ne dépend pas de m : même distance.</p>`, { indices: { fort: 'E = m v<sub>1</sub> / (q t<sub>1</sub>) : à masse plus faible, E plus faible.', d: 'E dépend de la masse.' } })] },
    { id: '14', groupe: 'charge', titre: 'Masse de l\'électron', desc: 'Déviation d\'un faisceau d\'électrons : trajectoire, quotient e/m, masse de l\'électron',
      contexte: `<p>À la fin du XIX<sup>e</sup> siècle, les premières déterminations de la masse de l'électron utilisaient la déviation d'un faisceau d'électrons dans un champ électrique. Les armatures sont distantes de L = 4,00 cm et longues de D = 10,0 cm ; tension U = 400 V. Un électron pénètre en O, à égale distance des plaques, avec ${V('v', '0')} parallèle aux armatures, v<sub>0</sub> = 2,50 × 10<sup>7</sup> ${MS}. Armature + en haut ; e = 1,60 × 10<sup>−19</sup> C.</p>${condo({ haut: '+', q: -1, traj: false, aria: 'Électron entrant en O à mi-distance des armatures, armature du haut positive' })}`,
      parties: [choix('a) Le champ ' + V('E') + ' entre les armatures est :', [['b', 'vertical, vers le bas'], ['h', 'vertical, vers le haut']], 'b', '<p>De l\'armature + (en haut) vers l\'armature − (en bas) ; la flèche de U, elle, pointe vers le haut.</p>', { indice: V('E') + ' va de + vers −.' }),
        choix('b) En négligeant le poids, l\'équation de la trajectoire est :', [['ok', `y(x) = ${fr('eU', '2mL')} ${fr('x<sup>2</sup>', 'v<sub>0</sub><sup>2</sup>')}`], ['m', `y(x) = −${fr('eU', '2mL')} ${fr('x<sup>2</sup>', 'v<sub>0</sub><sup>2</sup>')}`], ['d', `y(x) = ${fr('eU', '2mD')} ${fr('x<sup>2</sup>', 'v<sub>0</sub><sup>2</sup>')}`]], 'ok',
          `<p>${V('F', 'él')} = −e ${V('E')} ; ${REDAC('l\'électron')}, donc ${V('a')} = −e ${V('E')} / m : a<sub>x</sub> = 0, a<sub>y</sub> = eE / m. En intégrant : x = v<sub>0</sub> t, y = (eE / 2m) t² ; t = x / v<sub>0</sub> et E = U / L donnent y = eU x² / (2mL v<sub>0</sub>²).</p>`, { indices: { m: 'L\'électron monte, vers l\'armature +.', d: 'E = U / L : L est la distance entre les armatures.' } }),
        scient('c) À la sortie, y<sub>S</sub> = 14 mm. Valeur du quotient e / m (3 chiffres significatifs) :', 'e / m =', 1.75e11, 'C·kg<sup>−1</sup>', calc(`e / m = 2 L v<sub>0</sub>² y<sub>S</sub> / (U D²) = 14 × 10<sup>−3</sup> × 2 × 4,00 × 10<sup>−2</sup> × (2,50 × 10<sup>7</sup>)² / (400 × (10,0 × 10<sup>−2</sup>)²) = ${c_('1,75 × 10<sup>11</sup> C·kg<sup>−1</sup>')}`),
          { cs: 3, rel: .01, diag: () => 'Écris y(D) = y<sub>S</sub> et isole e / m ; toutes les longueurs en mètres.' }),
        scient('c) (suite) Masse de l\'électron (3 chiffres significatifs) :', 'm =', 1.6e-19 / 1.75e11, 'kg', `${calc(`m = e / 1,75 × 10<sup>11</sup> = 1,60 × 10<sup>−19</sup> / 1,75 × 10<sup>11</sup> = ${c_('9,14 × 10<sup>−31</sup> kg')}`)}<p>Écart relatif avec 9,11 × 10<sup>−31</sup> kg : (9,14 − 9,11) / 9,11 ≈ 0,4 % : valeur très proche.</p>`, { cs: 3, rel: .01, diag: () => 'm = e / (e / m).' })] },

    /* ---------- Pour aller plus loin ---------- */
    { id: '15', groupe: 'loin', titre: 'Lancer saturnien du javelot', desc: 'Record de 72,28 m : vitesse de lancer, record sur Saturne',
      contexte: `<p>L'athlète tchèque Barbora Špotáková détient le record du monde du lancer du javelot, avec 72,28 m (Stuttgart, 2008). On assimile le javelot à un objet ponctuel, lancé au niveau du sol avec une vitesse initiale v<sub>0</sub> faisant un angle α = 45° avec l'horizontale, dans un repère (O ; x, y) d'origine au point de départ. On néglige l'action de l'air. g = 9,81 N·kg<sup>−1</sup> sur Terre ; g<sub>0S</sub> = 11,50 ${MS2} sur Saturne.</p>`,
      parties: [choix('1. Expression de la trajectoire :', [['ok', `y(x) = −${fr('g', '2 (v<sub>0</sub> cos α)<sup>2</sup>')} x<sup>2</sup> + (tan α) x`], ['h', `y(x) = −${fr('g', '2 (v<sub>0</sub> cos α)<sup>2</sup>')} x<sup>2</sup> + (tan α) x + h`]], 'ok', `<p>${REDAC('le javelot')} = m ${V('g')} ; ${V('a')} ${col('0', '−g')} ; ${V('v')} ${col('v<sub>0</sub> cos α', '−g t + v<sub>0</sub> sin α')} ; ${V('OM')} ${col('(v<sub>0</sub> cos α) t', '−½ g t² + (v<sub>0</sub> sin α) t')} ; on élimine t.</p>`, { indice: 'Le javelot part du sol, à l\'origine.' }),
        nombre('2. Valeur de v<sub>0</sub> (3 chiffres significatifs) :', 'v<sub>0</sub> =', Math.sqrt(72.28 * 9.81 / 2) / Math.cos(Math.PI / 4), MS,
          `<p>Pour x = d, y = 0 : 0 = −g d² / (2 (v<sub>0</sub> cos α)²) + (tan α) d ⟺ d = 2 tan α (v<sub>0</sub> cos α)² / g ⟺ v<sub>0</sub> = (1 / cos α) ${CU.rac('d g / (2 tan α)')}</p>${calc(`v<sub>0</sub> = (1 / cos 45°) × ${CU.rac('72,28 × 9,81 / (2 tan 45°)')} = ${c_('26,6 ' + MS)}`)}`, { rel: .005, diag: () => 'Écris y(d) = 0, divise par d et isole v<sub>0</sub>.' }),
        nombre('3. Que deviendrait ce record sur Saturne ? (3 chiffres significatifs)', 'd<sub>S</sub> =', 72.28 * 9.81 / 11.5, 'm',
          `<p>Mêmes équations avec g<sub>0S</sub> : d<sub>S</sub> = 2 tan α (v<sub>0</sub> cos α)² / g<sub>0S</sub>, soit d<sub>S</sub> = d × g / g<sub>0S</sub>.</p>${calc(`d<sub>S</sub> = 72,28 × 9,81 / 11,50 = ${c_('61,7 m')}`)}`, { rel: .005, diag: v => (Math.abs(v - 72.28 * 11.5 / 9.81) < 1 ? 'Le champ est plus fort sur Saturne : le record est plus court (d proportionnelle à 1 / g).' : 'd<sub>S</sub> = 2 tan α (v<sub>0</sub> cos α)² / g<sub>0S</sub>.') })] },
    { id: '16', groupe: 'loin', titre: 'L\'Airbus A300 Zéro-G', desc: 'Vol parabolique : accélération, coordonnées de la vitesse, durée du vol (question complexe)',
      contexte: `<p>Le CNES mène un programme de vols paraboliques avec l'Airbus A300 Zéro-G, pour réaliser des expériences en impesanteur. En vol, l'avion est soumis à son poids ${V('P')}, à la poussée des moteurs ${V('π')}, à la traînée ${V('T')} et à la portance ${V('R')}. Pour effectuer une parabole, le pilote cabre l'avion jusqu'à un angle α, puis le manœuvre pour que la portance s'annule et que ${V('π')} compense exactement ${V('T')}.</p>
        <p>On étudie le centre d'inertie G dans le repère (O ; ${V('i')}, ${V('k')}). L'origine des dates est l'instant où l'avion arrive en A ; ${V('v', 'A')} est incliné de α = 49° par rapport à l'horizontale, v<sub>A</sub> = 145 ${MS}. En B, à la même altitude que A, ${V('v', 'B')} fait l'angle α avec l'horizontale, vers le bas, et v<sub>B</sub> = v<sub>A</sub>. Donnée : g = 9,78 ${MS2}.</p>${parabole()}`,
      parties: [choix('1. Vecteur accélération de G :', [['ok', `${V('a')} = ${V('g')}`], ['n', `${V('a')} = ${V('0')}`], ['p', `${V('a')} = (${V('π')} + ${V('T')}) / m`]], 'ok', `<p>${REDAC('l\'avion')} = ${V('P')} + ${V('π')} + ${V('T')} + ${V('R')} ; ${V('R')} = ${V('0')} et ${V('π')} + ${V('T')} = ${V('0')}, donc m ${V('a')} = m ${V('g')} : ${V('a')} = ${V('g')}, l'avion est en chute libre.</p>`, { indices: { n: 'Seules la poussée et la traînée se compensent : le poids reste.', p: V('π') + ' et ' + V('T') + ' se compensent.' } }),
        choix('2. a) et b) Coordonnées de l\'accélération et de la vitesse :', [['ok', 'a<sub>x</sub> = 0, a<sub>z</sub> = −g ; v<sub>x</sub> = v<sub>A</sub> cos α, v<sub>z</sub> = −g t + v<sub>A</sub> sin α'], ['sin', 'a<sub>x</sub> = 0, a<sub>z</sub> = −g ; v<sub>x</sub> = v<sub>A</sub> sin α, v<sub>z</sub> = −g t + v<sub>A</sub> cos α']], 'ok', '<p>On intègre a<sub>z</sub> = −g avec, à t = 0, v<sub>x</sub>(0) = v<sub>A</sub> cos α et v<sub>z</sub>(0) = v<sub>A</sub> sin α.</p>', { indice: 'Projection de ' + V('v', 'A') + ' : cos sur l\'horizontale.' }),
        complexe({ q: '3. Détermine la date t<sub>B</sub> à laquelle l\'avion arrive en B (en seconde, 3 chiffres significatifs).', label: 't<sub>B</sub> =', valeur: 2 * 145 * Math.sin(49 * Math.PI / 180) / 9.78, rel: .01, unite: 's', affiche: 22.4,
          reflexe: 'Commence par traduire l\'information sur le point B : sa vitesse a la même valeur qu\'en A et fait l\'angle α vers le bas. Écris la coordonnée v<sub>Bz</sub>, puis utilise v<sub>z</sub>(t) au point B.',
          diag: v => (Math.abs(v - 145 * Math.sin(49 * Math.PI / 180) / 9.78) < .3 ? 'C\'est la date du sommet (v<sub>z</sub> = 0) : en B, v<sub>z</sub> = −v<sub>A</sub> sin α.' : 'Au point B, v<sub>Bz</sub> = −v<sub>A</sub> sin α ; écris v<sub>z</sub>(t<sub>B</sub>) = v<sub>Bz</sub>.'),
          correction: `<p>En B, v<sub>Bz</sub> = −v<sub>B</sub> sin α = −v<sub>A</sub> sin α = −145 × sin 49° = −109,4 ${MS}. Or v<sub>z</sub>(t<sub>B</sub>) = −g t<sub>B</sub> + v<sub>A</sub> sin α = v<sub>Bz</sub> :</p>${calc(`t<sub>B</sub> = (v<sub>A</sub> sin α − v<sub>Bz</sub>) / g = 2 v<sub>A</sub> sin α / g = (145 × sin 49° + 109,4) / 9,78 = ${c_('22,4 s')}`)}<p>C'est la durée du vol parabolique (impesanteur).</p>`,
          etapes: [
            nombre('Étape 1 : valeur de v<sub>Bz</sub> = −v<sub>A</sub> sin α (en ' + MS + ', avec son signe) :', 'v<sub>Bz</sub> =', -145 * Math.sin(49 * Math.PI / 180), MS, '<p>v<sub>Bz</sub> = −145 × sin 49° = −109,4 ' + MS + ' (vers le bas).</p>', { signe: true, rel: .005, diag: v => (v > 0 ? 'En B, l\'avion descend : v<sub>Bz</sub> est négative.' : Math.abs(v + 145 * Math.cos(49 * Math.PI / 180)) < 1 ? 'La coordonnée verticale utilise sin α.' : 'v<sub>Bz</sub> = −v<sub>A</sub> sin α.') }),
            nombre('Étape 2 : écris v<sub>z</sub>(t<sub>B</sub>) = −g t<sub>B</sub> + v<sub>A</sub> sin α = v<sub>Bz</sub> et calcule t<sub>B</sub> :', 't<sub>B</sub> =', 2 * 145 * Math.sin(49 * Math.PI / 180) / 9.78, 's', '<p>t<sub>B</sub> = (v<sub>A</sub> sin α − v<sub>Bz</sub>) / g = 22,4 s.</p>', { rel: .01, diag: () => 't<sub>B</sub> = (v<sub>A</sub> sin α − v<sub>Bz</sub>) / g.' }),
          ] })] },
  ];

  CU.GROUPES_EX = [{ id: 'chute', titre: 'Chute libre (exercices 1 à 8)' }, { id: 'charge', titre: 'Particules chargées (exercices 9 à 14)' }, { id: 'loin', titre: 'Pour aller plus loin (exercices 15 et 16)' }];
  CU.EXERCICES = EXERCICES;
})();
