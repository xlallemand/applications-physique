/* ============================================================
   Plan et outils de l'application « Forces et mouvement : lois de
   Newton » (Terminale spécialité).
   Le moteur est celui de « Bilan des forces »
   (bilan-forces/modules/bf.js, chargé APRÈS ce fichier) : questions,
   séries notées sur 20, bilans des forces (BF.bilan), tracés dans un
   quadrillage (BF.partieResultante, BF.partieAcc), navigation
   BF.menu / BF.accueil. BF_AUTRE_PLAN : bf.js n'installe pas le plan
   de « Bilan des forces ».

   LN.SF, LN.SFX, LN.NUL, LN.V(n, s)    écritures : Σ F⃗, Σ F⃗ext, 0⃗, nom de vecteur
   LN.CALC                              icône calculatrice (après l'unité d'un champ)
   LN.partieReciproque(o)               tracer la force réciproque F⃗B/A dans un quadrillage
   LN.PHRASES, LN.COURTES               les six façons d'utiliser le principe d'inertie
                                        (phrases du cours, et version courte)
   LN.fl(x1, y1, x2, y2, coul, o)       flèche SVG (o.ep, o.tirets)
   LN.nom(x, y, n, s, coul, o)          nom de vecteur SVG (petite flèche au-dessus de la lettre)
   LN.svg(w, h, contenu, aria, cls)     figure SVG dans son cadre
   LN.chrono(o)                         chronophotographie (positions à intervalles de temps égaux) :
                                        o.type 'uniforme' | 'accelere' | 'ralenti' | 'courbe' | 'immobile',
                                        o.sens (1 : vers la droite, −1 : vers la gauche), o.n (nombre de positions)
   LN.mur(), LN.terreLune()             figures des actions réciproques (cours, fiche)
   LN.choixPhrase(o), LN.optsPhrases()  partie « quelle phrase utiliser ? » (séries, cours)
   ============================================================ */
(function () {
  'use strict';
  window.BF_AUTRE_PLAN = true;

  /* PLAN DE L'APPLICATION ET NAVIGATION (voir assets/sommaire.js) */
  const PLAN = [
    { n: 1, titre: 'Bilan des forces', desc: 'À savoir faire : le diagramme objet-action, puis chaque force sur le schéma (point d\'application, direction, sens), la réaction du support décomposée en <span class="vec-nom">R</span><sub>N</sub> + <span class="vec-nom">f</span>', fiche: 'fiche_1',
      // un cours très court, puis l'atelier de l'application « Bilan des forces » (page externe ↗)
      sousModules: true,
      parties: [
        { nom: 'Bilan des forces', slug: 'bilan', cours: 'module_1_cours', noms: { cours: 'Cours : bilan des forces en résumé' } },
        { nom: 'Atelier', externe: { app: 'bilan-forces', page: 'module_6_simulation', nom: 'Atelier : bilan des forces', appNom: 'Bilan des forces' } }] },
    { n: 2, titre: 'Troisième loi et référentiel galiléen', desc: 'Actions réciproques <span class="vec-nom">F</span><sub>A/B</sub> = −<span class="vec-nom">F</span><sub>B/A</sub> ; référentiels héliocentrique, géocentrique, terrestre', fiche: 'fiche_2',
      parties: [{ nom: 'Troisième loi et référentiel galiléen', cours: 'module_2_cours', questions: 'module_2_questions' }] },
    { n: 3, titre: 'Principe d\'inertie', desc: 'Première loi de Newton, système isolé ou pseudo-isolé, les six façons d\'utiliser le principe d\'inertie', fiche: 'fiche_3',
      sousModules: true,
      parties: [
        { nom: 'Énoncé du principe d\'inertie', slug: 'enonce', cours: 'module_3a_cours', noms: { cours: 'Cours : énoncé du principe d\'inertie' } },
        { nom: 'Six façons de l\'utiliser', slug: 'six', cours: 'module_3b_cours', noms: { cours: 'Cours : six façons d\'utiliser le principe d\'inertie' } },
        { nom: 'Principe d\'inertie', simulation: 'module_3_simulation', questions: 'module_3_questions', noms: { simulation: 'Animation : le principe d\'inertie' } }] },
    { n: 4, titre: 'Deuxième loi de Newton', desc: 'Σ <span class="vec-nom">F</span><sub>ext</sub> = m <span class="vec-nom">a</span> : résultante connaissant le mouvement, accélération connaissant les forces, sens de la résultante, projections', fiche: 'fiche_4',
      sousModules: true,
      parties: [
        { nom: 'Énoncé de la deuxième loi', slug: 'enonce', cours: 'module_4a_cours', noms: { cours: 'Cours : énoncé de la deuxième loi' } },
        { nom: 'Résultante connaissant le mouvement', slug: 'resultante', cours: 'module_4b_cours', noms: { cours: 'Cours : résultante connaissant le mouvement' } },
        { nom: 'Accélération connaissant les forces', slug: 'acceleration', cours: 'module_4c_cours', noms: { cours: 'Cours : accélération connaissant les forces' } },
        { nom: 'Sens et direction de la résultante', slug: 'sens', cours: 'module_4d_cours', noms: { cours: 'Cours : sens et direction de la résultante' } },
        { nom: 'Projections sur des axes', slug: 'projections', cours: 'module_4e_cours', noms: { cours: 'Cours : projections sur des axes' } },
        { nom: 'Deuxième loi de Newton', simulation: 'module_4_simulation', questions: 'module_4_questions', noms: { simulation: 'Atelier : somme des forces et accélération' } }] },
    { n: 5, titre: 'Exercices', desc: 'Les exercices 1 à 20 de la feuille, guidés pas à pas (ex. 20 : sujet de bac, le parapente)', exercices: 'module_5', exNom: 'Exercices 1 à 20', nbEx: 20 },
  ];
  window.SOM.init({ nom: 'Forces et mouvement : lois de Newton', id: 'lois-newton', cleEx: 'lois-newton-exercices', plan: PLAN });

  /* ============================================================
     ÉCRITURES
     ============================================================ */
  const V = (n, s) => `<span class="vec-nom">${n}</span>${s ? `<sub>${s}</sub>` : ''}`;
  const SF = `Σ ${V('F')}`, SFX = `Σ ${V('F', 'ext')}`, NUL = V('0');
  // icône calculatrice, à placer après l'unité d'un champ dont la valeur se calcule à la calculatrice (charte §7)
  const CALC = ' <span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';

  // les six façons d'utiliser le principe d'inertie (phrases du cours, telles quelles)
  const PHRASES = [
    `Le système est immobile / a un mouvement rectiligne uniforme donc, d'après le principe d'inertie, la résultante des forces qui s'exercent sur le système est nulle (${SFX} = ${NUL}).`,
    `La résultante des forces qui s'exercent sur le système est nulle (${SFX} = ${NUL}) donc, d'après le principe d'inertie, le système reste immobile / a un mouvement rectiligne uniforme.`,
    `Le système n'a pas un mouvement rectiligne uniforme donc, d'après le principe d'inertie, la résultante des forces qui s'exercent sur le système est non nulle (${SFX} ≠ ${NUL}).`,
    `La résultante des forces qui s'exercent sur le système n'est pas nulle (${SFX} ≠ ${NUL}) donc, d'après le principe d'inertie, le système ne reste pas immobile / n'a pas un mouvement rectiligne uniforme.`,
    'Le système est immobile / a un mouvement rectiligne uniforme et la résultante des forces qui s\'exercent sur le système n\'est pas nulle donc, d\'après le principe d\'inertie, le référentiel n\'est pas galiléen.',
    'Le système n\'a pas un mouvement rectiligne uniforme et la résultante des forces qui s\'exercent sur le système est nulle donc, d\'après le principe d\'inertie, le référentiel n\'est pas galiléen.',
  ];
  const COURTES = [
    `immobile / MRU, donc ${SF} = ${NUL}`,
    `${SF} = ${NUL}, donc immobile / MRU`,
    `pas de MRU, donc ${SF} ≠ ${NUL}`,
    `${SF} ≠ ${NUL}, donc ni immobile ni MRU`,
    `immobile / MRU et ${SF} ≠ ${NUL} : référentiel non galiléen`,
    `pas de MRU et ${SF} = ${NUL} : référentiel non galiléen`,
  ];

  /* ============================================================
     PETITES FIGURES SVG (couleurs : attributs de présentation)
     ============================================================ */
  const ENCRE = '#16181d', ENCRE2 = '#55585f', ENCRE3 = '#8d8f94';
  const f1 = v => (Math.round(v * 10) / 10).toString();
  // flèche de (x1, y1) à (x2, y2)
  function fl(x1, y1, x2, y2, coul, o) {
    o = o || {};
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return '';
    const ux = dx / L, uy = dy / L, lt = Math.min(o.lt || 11, L * .6), lw = lt * .45, bx = x2 - ux * lt, by = y2 - uy * lt;
    return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx + ux)}" y2="${f1(by + uy)}" stroke="${coul || ENCRE}" stroke-width="${o.ep || 2.4}" stroke-linecap="round"${o.tirets ? ' stroke-dasharray="5 4"' : ''}/>` +
      `<path d="M${f1(x2)},${f1(y2)} L${f1(bx - uy * lw)},${f1(by + ux * lw)} L${f1(bx + uy * lw)},${f1(by - ux * lw)} Z" fill="${coul || ENCRE}"/>`;
  }
  // nom d'un vecteur centré en x : lettre, indice, petite flèche au-dessus de la lettre
  function nom(x, y, n, s, coul, o) {
    o = o || {};
    const t = o.t || 15, wl = n.length * t * .62, ws = s ? s.length * t * .45 : 0, x0 = x - (wl + ws) / 2, c = coul || ENCRE;
    return `<g fill="${c}" stroke="none"><text x="${f1(x0)}" y="${f1(y)}" font-size="${t}" font-weight="800" font-family="Hanken Grotesk, Arial, sans-serif">${n}${s ? `<tspan dy="${f1(t * .3)}" font-size="${f1(t * .68)}">${s}</tspan>` : ''}</text>` +
      `<path d="M${f1(x0 + 1)},${f1(y - t * .9)} h${f1(wl)} m-3,-2.5 l3,2.5 l-3,2.5" fill="none" stroke="${c}" stroke-width="1.2"/></g>`;
  }
  const svg = (w, h, contenu, aria, cls) => `<div class="ln-fig-cadre"><svg viewBox="0 0 ${w} ${h}" class="ln-fig${cls ? ' ' + cls : ''}" style="max-width:${Math.round(w * 1.25)}px" role="img" aria-label="${aria}">${contenu}</svg></div>`;
  const txt = (x, y, t, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-size="${o.t || 12}" font-weight="${o.g || 600}" fill="${o.c || ENCRE2}" text-anchor="${o.a || 'start'}" font-family="Hanken Grotesk, Arial, sans-serif">${t}</text>`; };

  // chronophotographie : positions successives à intervalles de temps égaux
  function chrono(o) {
    o = Object.assign({ type: 'uniforme', sens: 1, n: 8 }, o);
    const W = 320, H = o.type === 'courbe' ? 150 : 74, pts = [];
    const x0 = o.sens > 0 ? 30 : W - 30;
    if (o.type === 'immobile') pts.push([W / 2, 40]);
    else if (o.type === 'courbe') {
      // arc de cercle parcouru à vitesse constante
      for (let k = 0; k < o.n; k++) { const a = Math.PI * (.95 - k * .9 / (o.n - 1)); pts.push([W / 2 + 125 * Math.cos(a) * o.sens * -1, 140 - 110 * Math.sin(a)]); }
    } else {
      // écarts : constants, croissants ou décroissants
      const ecarts = [];
      for (let k = 1; k < o.n; k++) ecarts.push(o.type === 'uniforme' ? 1 : o.type === 'accelere' ? k : o.n - k);
      const tot = ecarts.reduce((a, b) => a + b, 0), L = W - 60;
      let x = 0;
      pts.push([x0, 40]);
      ecarts.forEach(e => { x += e / tot * L; pts.push([x0 + o.sens * x, 40]); });
    }
    let s = '';
    if (o.type !== 'immobile' && o.type !== 'courbe') s += `<line x1="16" y1="40" x2="${W - 16}" y2="40" stroke="${ENCRE3}" stroke-width="1" stroke-dasharray="3 4"/>`;
    pts.forEach((p, k) => { s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="4.5" fill="${k === 0 ? '#5a3fc4' : ENCRE}"/>`; });
    if (o.type === 'immobile') s += txt(W / 2, 64, 'toutes les positions sont confondues', { a: 'middle', t: 11 });
    else {
      // sens du mouvement : flèche après la dernière position
      const a = pts[pts.length - 2], b = pts[pts.length - 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
      if (o.type !== 'courbe') s += txt(x0, 64, 'départ', { a: 'middle', t: 11 });
      s += fl(b[0] + ux * 8, b[1] + uy * 8 - (o.type === 'courbe' ? 0 : 14), b[0] + ux * 30, b[1] + uy * 30 - (o.type === 'courbe' ? 0 : 14), ENCRE3, { ep: 1.6, lt: 8 });
    }
    return svg(W, H, s, o.aria || 'Chronophotographie : positions successives du système à intervalles de temps égaux', 'ln-chrono');
  }

  // une personne pousse un mur : les deux forces réciproques
  function mur() {
    const cP = '#c2255c', cM = '#1971c2';
    let s = `<rect x="196" y="20" width="26" height="150" fill="#ebe8e1" stroke="${ENCRE2}" stroke-width="1.5"/>` +
      `<line x1="30" y1="170" x2="290" y2="170" stroke="${ENCRE}" stroke-width="2"/>` +
      // la personne (bonhomme), bras tendus vers le mur
      `<g stroke="${ENCRE}" stroke-width="3" stroke-linecap="round" fill="none"><circle cx="118" cy="52" r="13" fill="#fff"/><line x1="122" y1="65" x2="132" y2="112"/>` +
      `<line x1="126" y1="80" x2="196" y2="88"/><line x1="128" y1="84" x2="196" y2="98"/><line x1="132" y1="112" x2="112" y2="168"/><line x1="132" y1="112" x2="150" y2="168"/></g>`;
    s += fl(196, 93, 262, 93, cP) + nom(240, 82, 'F', 'personne/mur', cP, { t: 14 });
    s += fl(186, 120, 120, 120, cM) + nom(150, 140, 'F', 'mur/personne', cM, { t: 14 });
    s += txt(209, 186, 'mur', { a: 'middle' }) + txt(70, 186, 'personne', { a: 'middle' });
    return svg(320, 196, s, 'Une personne pousse un mur : la force de la personne sur le mur et la force du mur sur la personne ont la même direction, des sens opposés et la même valeur');
  }
  // la Terre et la Lune s'attirent mutuellement
  function terreLune() {
    const c1 = '#d9480f', c2 = '#1971c2';
    let s = `<circle cx="70" cy="70" r="44" fill="#e7f0fb" stroke="${ENCRE2}" stroke-width="1.5"/><circle cx="270" cy="70" r="14" fill="#ebe8e1" stroke="${ENCRE2}" stroke-width="1.5"/>`;
    s += fl(270, 70, 200, 70, c1) + nom(232, 56, 'F', 'T/L', c1);
    s += fl(70, 70, 140, 70, c2) + nom(108, 56, 'F', 'L/T', c2);
    s += txt(70, 132, 'Terre', { a: 'middle' }) + txt(270, 104, 'Lune', { a: 'middle' });
    return svg(330, 140, s, 'La Terre attire la Lune et la Lune attire la Terre : deux forces de même valeur, de même direction et de sens opposés');
  }

  /* ============================================================
     PARTIE « QUELLE PHRASE UTILISER ? »
     o = { bonne: 1 à 6, indice, solution, q }
     ============================================================ */
  const optsPhrases = () => COURTES.map((t, i) => ({ id: String(i + 1), label: `${i + 1}. ${t}` }));
  function choixPhrase(o) {
    const b = String(o.bonne);
    return { type: 'choix', q: o.q || 'Quelle façon d\'utiliser le principe d\'inertie convient ici ?', options: optsPhrases(), bonne: b, melanger: false, colonne: true,
      indice: o.indice || 'Qu\'est-ce qui est connu : le mouvement, ou la résultante des forces ? Le référentiel est-il galiléen ?',
      solution: `<p>Phrase ${b} : « ${PHRASES[+b - 1]} »</p>${o.solution ? `<p>${o.solution}</p>` : ''}` };
  }

  /* ============================================================
     PARTIE « TRACER LA FORCE RÉCIPROQUE » (quadrillage de
     cinematique/modules/vecteurs.js, à charger avant)
     o = { fab: [x, y] (F⃗A/B, appliquée en B), A: [x, y], B: [x, y], nA, nB (noms des objets), solution }
     L'élève trace F⃗B/A depuis le point A (sur l'objet A).
     ============================================================ */
  function partieReciproque(o) {
    const fba = [-o.fab[0], -o.fab[1]];
    return { type: 'perso', q: o.q || `Trace la force ${V('F', 'B/A')} exercée par ${o.nB} sur ${o.nA}, depuis le point A (glisse la pointe, ou utilise les flèches), puis valide.`, solution: o.solution,
      monter(zone, api) {
        const rep = new window.VEC.Repere(zone, { xmin: -5, xmax: 5, ymin: -4, ymax: 4, axes: false, unitaires: false, mode: 'mixte',
          points: [{ nom: 'A', x: o.A[0], y: o.A[1], dx: -12, dy: 16 }, { nom: 'B', x: o.B[0], y: o.B[1], dx: 8, dy: 16 }], aria: 'Quadrillage : la force exercée par A sur B est tracée depuis B',
          vecteurs: [{ nom: 'F_A/B', dep: o.B, coord: o.fab, fixe: true, coul: '#c2255c' }, { nom: 'F_B/A', dep: o.A, coord: fba }] });
        const bVal = window.BF.boutonValider(zone);
        bVal.onclick = () => {
          if (api.fini()) return;
          const v = rep.vs[1];
          if (!v.fin) { api.message(`Trace d'abord ${V('F', 'B/A')} depuis le point A.`); return; }
          const d = [v.fin[0] - v.dep[0], v.fin[1] - v.dep[1]];
          const r = rep.verifier()[0];
          if (r.code === 'ok') { bVal.fermer(); api.reussi(); return; }
          api.erreur(d[0] === o.fab[0] && d[1] === o.fab[1] ? `Même direction et même valeur, mais ${V('F', 'B/A')} est de <b>sens opposé</b> à ${V('F', 'A/B')}.`
            : Math.abs(d[0] * fba[1] - d[1] * fba[0]) < 1e-9 && d[0] * fba[0] + d[1] * fba[1] > 0 ? 'La direction et le sens sont bons, mais pas la valeur : les deux forces ont la <b>même valeur</b> (même longueur).'
            : `${V('F', 'B/A')} a la même direction que ${V('F', 'A/B')}, le sens opposé et la même valeur.`);
        };
        return { montrer() { rep.montrer(); bVal.fermer(); } };
      } };
  }

  window.LN = { PLAN, CALC, V, SF, SFX, NUL, PHRASES, COURTES, fl, nom, svg, txt, chrono, mur, terreLune, optsPhrases, choixPhrase, partieReciproque, ENCRE, ENCRE2, ENCRE3 };
})();
