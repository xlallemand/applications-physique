/* ============================================================
   Module 3 : banc d'optique (simulation)
   LT.simulateurBanc(zone)
   Banc gradué de 0 à 100 cm : lanterne et objet (lettre « d », AB = 3,0 cm) au zéro, fixes ;
   lentille (10 δ, 5 δ ou 20 δ) et écran à glisser, ou ± 1 cm et ± 1 mm.
   L'image sur l'écran est floue sauf quand l'écran est en A′ (± 3 mm) : elle est alors nette,
   renversée (la lettre tournée d'un demi-tour) et à la bonne taille ; l'écran est gradué.
   Case « Afficher la construction » : schéma du banc (deux rayons issus de B) qui suit les déplacements.
   Objet entre F et O : aucune image nette, bulle « Hors programme », rayons émergents qui divergent
   et leurs prolongements en pointillés.
   Position de l'image : relation de conjugaison (OPT.conjuguer), calcul interne jamais affiché.
   Déroulé guidé : mesurer AB ; lentille à 40 cm (OA′ = 13,3 cm) ; A′B′ et γ ; lentille à 20 cm (γ = 1) ; bilan.
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, fmt = LT.fmt;
  const AB = 3;                                    // taille de l'objet (cm)
  const LENTILLES = [10, 5, 20];                   // vergences proposées (δ)
  const NET = 0.3;                                 // tolérance de netteté (cm)
  const DIAM = 4;                                  // diamètre de la lentille (cm), pour le flou
  // banc : abscisse dans la scène pour une position en cm
  const X0 = -368, K = 7.0;
  const X = cm => X0 + cm * K;
  const Y_AXE = 46;                                // hauteur de l'axe optique au-dessus du rail (unités)
  let compteur = 0;                                // identifiants des filtres de flou (plusieurs simulateurs possibles)

  const lettre = LT.lettre;

  /* ---------- Vue rapprochée (objet ou écran) avec règle graduée en cm et mm ---------- */
  function vue(zone, aria) {
    const S = OPT.scene(zone, { largeur: 240, hauteur: 260, aria });
    const U = 20;                                  // unités par cm
    S.poly('fond', [[-120, -130], [120, -130], [120, 130], [-120, 130]], 'lt-vue-fond');
    // règle verticale (0 sur l'axe optique), graduée en mm, nombres tous les cm
    const xr = -78;
    S.ligne('deco', [xr, -125], [xr, 125], 'lt-regle');
    for (let mm = -55; mm <= 55; mm++) {
      const y = mm * U / 10, k = mm % 10 === 0 ? 12 : mm % 5 === 0 ? 8 : 4;
      S.ligne('deco', [xr, y], [xr + k, y], 'lt-regle-g');
      if (mm % 10 === 0) S.texte('deco', [xr - 14, y], String(Math.abs(mm / 10)), { taille: 11, cls: 'lt-g-txt' });
    }
    S.texte('deco', [xr + 22, -121], 'cm', { taille: 11, cls: 'lt-g-txt' });
    S.ligne('deco', [xr - 4, 0], [118, 0], 'lt-axe-vue');
    return { S, U };
  }

  function simulateurBanc(zone) {
    const id = ++compteur;
    const etat = { v: 10, xL: 25, xE: 70, construction: false };
    const f = () => 100 / etat.v;
    // image (calcul interne) : OA′ en cm, γ, réelle ou non
    function image() {
      const OA = etat.xL, fc = f();
      if (OA <= fc + 0.05) return { reelle: false, virtuelle: OA < fc - 0.05, OA, f: fc };
      const OAi = OPT.conjuguer(-OA, fc);
      return { reelle: true, OA, f: fc, OAi, xi: etat.xL + OAi, g: OAi / OA };
    }
    const nette = () => { const im = image(); return im.reelle && Math.abs(etat.xE - im.xi) <= NET + 1e-9; };

    // banc et construction sur toute la largeur ; dessous, commandes et vues à gauche, étapes à droite
    zone.innerHTML = `<div class="er-card">
      <div class="lt-sim-reglages">
        <div class="lt-lentilles" role="group" aria-label="Choix de la lentille">${LENTILLES.map(v => `<button type="button" class="btn-secondary" data-v="${v}" aria-pressed="false">Lentille de ${v} δ</button>`).join('')}</div>
        <p class="lt-vergence" data-a="verg"></p>
      </div>
      <div class="lt-fig lt-fig-banc"></div>
      <label class="lt-coche"><input type="checkbox" data-a="constr"> Afficher la construction</label>
      <div data-a="constrZ" hidden><p class="lt-echelle">Schéma du banc : longueurs à l'échelle, hauteurs agrandies 3 fois.</p><div class="lt-fig lt-fig-constr"></div></div>
      <div class="lt-manip lt-manip-banc">
        <div class="lt-manip-fig">
          <div class="lt-banc-cmd">
            <div class="lt-cmd-g"><span class="lt-cmd-t">Lentille : <b data-a="pL"></b></span><span data-a="bL"></span></div>
            <div class="lt-cmd-g"><span class="lt-cmd-t">Écran : <b data-a="pE"></b></span><span data-a="bE"></span></div>
          </div>
          <div class="lt-vues">
            <figure class="lt-vue"><figcaption>Objet (sur la lanterne)</figcaption><div data-a="vObj"></div></figure>
            <figure class="lt-vue"><figcaption>Écran <span data-a="etatEcran"></span></figcaption><div data-a="vEcr"></div></figure>
          </div>
        </div>
        <div class="lt-manip-panneau"><ol class="lt-deroule lt-deroule-court" data-a="deroule"></ol><div class="lt-etape" data-a="etape"></div></div>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);

    /* ----- Banc vu de côté ----- */
    const S = OPT.scene(zone.querySelector('.lt-fig-banc'), { largeur: 840, hauteur: 250, aria: 'Banc d\'optique gradué de 0 à 100 cm : lanterne et objet au zéro, lentille et écran à déplacer' });
    // rail gradué (fixe)
    S.poly('fond', [[X(-2), -62], [X(102), -62], [X(102), -76], [X(-2), -76]], 'lt-rail');
    for (let c = 0; c <= 100; c++) {
      const k = c % 10 === 0 ? 12 : c % 5 === 0 ? 8 : 5;
      S.ligne('fond', [X(c), -62], [X(c), -62 + k], 'lt-rail-g');
      if (c % 10 === 0) S.texte('fond', [X(c), -92], String(c), { taille: 14, cls: 'lt-g-txt' });
    }
    S.texte('fond', [X(103.5), -90], 'cm', { taille: 11, cls: 'lt-g-txt', ancre: 'start' });
    // lanterne et objet au zéro
    S.poly('fond', [[X(-6.5), -62], [X(-0.6), -62], [X(-0.6), 95], [X(-6.5), 95]], 'lt-lanterne');
    S.texte('fond', [X(-3.5), 110], 'lanterne', { taille: 13, cls: 'lt-g-txt' });
    S.poly('fond', [[X(-0.6), 10], [X(0.4), 10], [X(0.4), 82], [X(-0.6), 82]], 'lt-plaque');
    S.ligne('fond', [X(0), -62], [X(0), 10], 'lt-tige');
    S.texte('fond', [X(1.8), 92], 'objet', { taille: 13, cls: 'lt-g-txt', ancre: 'start' });
    const gL = OPT.svgEl('g', null, S.calque('deco')), gE = OPT.svgEl('g', null, S.calque('deco'));
    function dessinerBanc() {
      [gL, gE].forEach(g => { while (g.firstChild) g.removeChild(g.firstChild); });
      // lentille sur son support
      const xl = X(etat.xL);
      S.ligne(gL, [xl, -62], [xl, 10], 'lt-tige');
      S.poly(gL, [[xl - 9, -62], [xl + 9, -62], [xl + 9, -54], [xl - 9, -54]], 'lt-cavalier');
      const pts = []; for (let a = 0; a <= 360; a += 15) pts.push([xl + 6 * Math.cos(a * Math.PI / 180), Y_AXE + 34 * Math.sin(a * Math.PI / 180)]);
      S.poly(gL, pts, 'lt-lentille-verre');
      S.texte(gL, [xl, 98], `${etat.v} δ`, { taille: 14, cls: 'lt-g-nom' });
      // écran sur son support
      const xe = X(etat.xE);
      S.ligne(gE, [xe, -62], [xe, 0], 'lt-tige');
      S.poly(gE, [[xe - 9, -62], [xe + 9, -62], [xe + 9, -54], [xe - 9, -54]], 'lt-cavalier');
      S.poly(gE, [[xe - 3, 0], [xe + 3, 0], [xe + 3, 96], [xe - 3, 96]], 'lt-ecran');
      S.texte(gE, [xe, 110], 'écran', { taille: 14, cls: 'lt-g-nom' });
      // faisceau de la lanterne jusqu'à la lentille (repère visuel)
      S.vider('rayons');
      S.poly('rayons', [[X(0.4), Y_AXE + 30], [xl, Y_AXE + 30], [xl, Y_AXE - 30], [X(0.4), Y_AXE - 30]], 'lt-faisceau');
    }

    /* ----- Poignées de la lentille et de l'écran ----- */
    const arrondi = c => Math.round(c * 10) / 10;
    function regler(quoi, c) {
      if (quoi === 'L') etat.xL = Math.max(1, Math.min(etat.xE - 1, arrondi(c)));
      else etat.xE = Math.max(etat.xL + 1, Math.min(100, arrondi(c)));
      tout();
    }
    const yP = -82;
    const pgL = OPT.poignee(S, { p: [X(etat.xL), yP], pas: K, aria: 'Poignée de la lentille : la glisser le long du banc',
      aimant: q => [X(Math.max(1, Math.min(etat.xE - 1, arrondi((q[0] - X0) / K)))), yP],
      surChange: p => { etat.xL = arrondi((p[0] - X0) / K); tout(true); } });
    const pgE = OPT.poignee(S, { p: [X(etat.xE), yP], pas: K, aria: 'Poignée de l\'écran : la glisser le long du banc',
      aimant: q => [X(Math.max(etat.xL + 1, Math.min(100, arrondi((q[0] - X0) / K)))), yP],
      surChange: p => { etat.xE = arrondi((p[0] - X0) / K); tout(true); } });
    function boutons(z, quoi) {
      const box = LT.el('div', 'lt-pm');
      [['−1 cm', -1], ['−1 mm', -0.1], ['+1 mm', 0.1], ['+1 cm', 1]].forEach(([t, d]) => {
        const b = LT.el('button', 'btn-secondary opt-fl lt-pm-b', t);
        b.type = 'button';
        b.setAttribute('aria-label', `${quoi === 'L' ? 'Lentille' : 'Écran'} : ${t.replace('−', 'moins ').replace('+', 'plus ')}`);
        b.onclick = () => regler(quoi, (quoi === 'L' ? etat.xL : etat.xE) + d);
        box.appendChild(b);
      });
      z.appendChild(box);
    }
    boutons($('bL'), 'L'); boutons($('bE'), 'E');

    /* ----- Choix de la lentille ----- */
    zone.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => { etat.v = +b.dataset.v; tout(); }; });

    /* ----- Vues rapprochées : objet et écran ----- */
    const vObj = vue($('vObj'), 'Objet : la lettre d éclairée par la lanterne, avec une règle graduée');
    lettre(vObj.S.calque('rayons'), 6, 0, AB * vObj.U, false, 'lt-lettre');
    const vEcr = vue($('vEcr'), 'Écran : l\'image de la lettre, avec une règle graduée');
    const defs = OPT.svgEl('defs', null, vEcr.S.svg);
    const filtre = OPT.svgEl('filter', { id: 'lt-flou-' + id, filterUnits: 'userSpaceOnUse', x: -120, y: -130, width: 240, height: 260 }, defs);
    const flou = OPT.svgEl('feGaussianBlur', { stdDeviation: 0 }, filtre);
    const gImg = OPT.svgEl('g', { filter: `url(#lt-flou-${id})` }, vEcr.S.calque('rayons'));
    let bulleMise = false;
    function dessinerEcran() {
      while (gImg.firstChild) gImg.removeChild(gImg.firstChild);
      const im = image(), $et = $('etatEcran');
      if (!im.reelle) {
        // pas d'image réelle : une tache de lumière diffuse, quelle que soit la position de l'écran
        flou.setAttribute('stdDeviation', 14);
        OPT.svgEl('ellipse', { cx: 6, cy: 0, rx: 70, ry: 70, class: 'lt-tache' }, gImg);
        // la bulle n'est écrite qu'une fois (une bulle ouverte reste attachée à son bouton)
        const h = im.virtuelle ? `: aucune image nette ${BULLE.info('<b>Hors programme.</b> L\'objet est entre F et O : l\'image est virtuelle. On ne peut pas la recueillir sur un écran ; on la voit en regardant à travers la lentille, comme avec une loupe.', 'Hors programme : objet entre F et O')}` : ': aucune image nette';
        if ($et.dataset.h !== h) { $et.innerHTML = h; $et.dataset.h = h; }
        bulleMise = im.virtuelle;
        return;
      }
      if (bulleMise) { BULLE.fermer(); bulleMise = false; }
      const dlt = Math.abs(etat.xE - im.xi);
      const tache = DIAM * dlt / im.OAi;                // diamètre de la tache de flou (cm)
      const s = dlt <= NET + 1e-9 ? 0 : Math.min(22, Math.max(1.2, tache * vEcr.U / 2.2));
      flou.setAttribute('stdDeviation', String(Math.round(s * 100) / 100));
      // tache de lumière (d'autant plus large que l'écran est loin de A′), puis la lettre
      const r = Math.max(AB * im.g, tache / 2) * vEcr.U;
      if (s > 0) OPT.svgEl('ellipse', { cx: -6 * im.g, cy: AB * im.g * vEcr.U / 2, rx: r * 0.8, ry: r * 0.8, class: 'lt-tache' }, gImg);
      lettre(gImg, -6 * im.g, 0, AB * im.g * vEcr.U, true, 'lt-lettre');
      $et.textContent = dlt <= NET + 1e-9 ? ': image nette' : ': image floue';
      $et.dataset.h = '';
    }

    /* ----- Construction (schéma du banc, hauteurs × 3) ----- */
    const C = OPT.scene(zone.querySelector('.lt-fig-constr'), { largeur: 840, hauteur: 220, aria: 'Construction : lentille, foyers, objet AB, deux rayons issus de B et image A′B′' });
    const KY = 3 * K;                               // hauteurs agrandies 3 fois
    const P = p => [X(p[0]), p[1] * KY];
    function dessinerConstruction() {
      ['fond', 'deco', 'rayons', 'textes'].forEach(n => C.vider(n));
      if (!etat.construction) return;
      const fc = f(), xl = etat.xL, B = [0, AB];
      C.ligne('fond', [X(-6), 0], [X(104), 0], 'opt-axe');
      C.lentille({ O: P([xl, 0]), f: fc * K, h: 4.6 * KY, calque: 'deco', axe: false });
      C.fleche('textes', P([0, 0]), P(B), 'opt-objet');
      C.texte('textes', P([-1.6, -0.6]), 'A', { cls: 'opt-nom-pt' });
      C.texte('textes', P([-1.6, AB]), 'B', { cls: 'opt-nom-pt' });
      C.ligne('deco', P([etat.xE, -4.6]), P([etat.xE, 4.6]), 'lt-ecran-trait');
      C.texte('textes', [X(etat.xE) + 4, 4.6 * KY - 4], 'écran', { taille: 11, cls: 'lt-g-txt', ancre: 'start' });
      // deux rayons issus de B (calculés en cm, puis dessinés : la transformation garde les droites)
      const loin = (p, d) => { const t = d[0] > 1e-9 ? (108 - p[0]) / d[0] : 200; return V.add(p, V.mul(d, t)); };
      const rayons = [{ I: [xl, AB], d: [1, 0] }, { I: [xl, 0], d: V.norm(V.sub([xl, 0], B)) }];
      const im = image();
      rayons.forEach(r => {
        const e = OPT.emergent([xl, 0], fc, r.I, r.d);
        C.rayon('rayons', P(B), P(r.I), { fleche: 1, cls: 'opt-fin' });
        C.rayon('rayons', P(r.I), P(loin(r.I, e)), { fleche: 1, cls: 'opt-fin' });
        // image virtuelle : prolongement des rayons émergents en pointillés, vers l'arrière
        if (im.virtuelle) { const t = 60; C.rayon('rayons', P(r.I), P(V.sub(r.I, V.mul(e, t))), { virtuel: true, cls: 'opt-fin' }); }
      });
      if (im.reelle && im.xi < 106) {
        C.fleche('textes', P([im.xi, 0]), P([im.xi, -AB * im.g]), 'opt-image');
        C.texte('textes', P([im.xi + 1.6, 0.6]), 'A′', { cls: 'opt-nom-pt' });
        C.texte('textes', P([im.xi + 1.6, -AB * im.g]), 'B′', { cls: 'opt-nom-pt' });
      } else if (im.virtuelle) {
        const xv = xl + OPT.conjuguer(-im.OA, fc), hv = AB * OPT.conjuguer(-im.OA, fc) / -im.OA;
        if (xv > -6) {
          C.ligne('textes', P([xv, 0]), P([xv, hv]), 'lt-virtuelle');
          C.texte('textes', P([xv - 1.6, hv]), 'B′', { cls: 'opt-nom-pt' });
        }
      }
    }
    $('constr').onchange = () => { etat.construction = $('constr').checked; $('constrZ').hidden = !etat.construction; dessinerConstruction(); };

    /* ----- Mise à jour générale ----- */
    function tout(depuisPoignee) {
      if (!depuisPoignee) { pgL.regler([X(etat.xL), yP]); pgE.regler([X(etat.xE), yP]); }
      zone.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === etat.v ? 'true' : 'false'));
      $('verg').textContent = LT.vergence(etat.v) + '.';
      $('pL').textContent = fmt(etat.xL, 1) + ' cm';
      $('pE').textContent = fmt(etat.xE, 1) + ' cm';
      dessinerBanc(); dessinerEcran(); dessinerConstruction();
      if (verif) verif();
    }

    /* ============================================================
       Déroulé guidé
       ============================================================ */
    const ETAPES = [
      { t: 'Mesurer la taille AB de l\'objet', entrer: mesurerAB },
      { t: 'Lentille de 10 δ à 40 cm de l\'objet', entrer: z => chercher(z, 40, false) },
      { t: 'Taille de l\'image et grandissement', entrer: z => grandissement(z, 40) },
      { t: 'Lentille de 10 δ à 20 cm de l\'objet', entrer: z => chercher(z, 20, true) },
    ];
    const ol = $('deroule');
    ol.innerHTML = ETAPES.map(e => `<li><span>${e.t}</span></li>`).join('') + '<li><span>Bilan</span></li>';
    const lis = Array.from(ol.children);
    let k = 0, verif = null;
    const $e = $('etape');
    const mesures = {};
    function marquer() { lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); }); }
    function entrer() {
      verif = null; marquer();
      $e.innerHTML = `<h4 class="lt-etape-titre">${k + 1}. ${ETAPES[k].t}</h4><div class="lt-etape-corps"></div>`;
      ETAPES[k].entrer($e.querySelector('.lt-etape-corps'));
      if (k > 0) LT.amener(LT.surOrdi() ? zone.querySelector('.lt-manip') : $e, 0.4);
    }
    function conclure(texte) {
      verif = null;
      const d = LT.el('div', 'lt-conclusion', `<div class="callout-success er-retour"><p><b class="er-ok">Bilan de l'étape.</b> ${texte}</p></div>
        <div class="er-actions"><button type="button" class="btn-primary">${k < ETAPES.length - 1 ? 'Suite →' : 'Voir le bilan →'}</button></div>`);
      $e.appendChild(d);
      d.querySelector('button').onclick = () => { k++; if (k < ETAPES.length) entrer(); else fin(); };
      LT.defiler(d);
    }
    // une question (une ou plusieurs parties) dans l'étape en cours
    function questions(z, parties, ok) {
      const d = LT.el('div');
      z.appendChild(d);
      LT.question(d, { parties }, { fin: () => ok() }, 'manip');
      LT.defiler(d);
    }
    // consigne vérifiée sur l'état du banc ; elle se coche quand elle est réussie
    function consigne(z, texte, test, ok) {
      const p = LT.el('p', 'lt-consigne', texte);
      z.appendChild(p);
      verif = () => { if (test()) { verif = null; p.classList.add('lt-faite'); p.innerHTML = '✓ ' + texte; ok(); } };
      verif();
    }

    /* ----- 1. Mesurer AB ----- */
    function mesurerAB(z) {
      z.innerHTML = '<p class="lt-li-aide">L\'objet est la lettre « d » découpée dans la plaque de la lanterne. On le représente par une flèche AB : A sur l\'axe optique, B en haut de la lettre.</p>';
      questions(z, [{ type: 'nombre', q: 'Mesure la taille AB de la lettre avec la règle de la vue « Objet ».', label: 'AB =', unite: 'cm', aria: 'Taille de l\'objet en centimètres',
        verifier: v => Math.abs(v - 3) <= 0.1 ? { ok: true } : Math.abs(v - 30) <= 1 ? { diag: 'La règle est graduée en centimètres : écris AB en cm (30 mm = 3,0 cm).' } : { diag: 'Lis la graduation au niveau du haut de la lettre : le 0 de la règle est sur l\'axe optique, au pied de la lettre.' },
        remplir: i => { i.value = '3,0'; } }], () => { mesures.AB = 3; conclure('AB = 3,0 cm.'); });
    }

    /* ----- 2 et 4. Chercher l'image nette ----- */
    function chercher(z, OA, deuxieme) {
      z.innerHTML = '<div data-a="c1"></div><div data-a="c2"></div><div data-a="c3"></div>';
      const c1 = z.querySelector('[data-a="c1"]'), c2 = z.querySelector('[data-a="c2"]'), c3 = z.querySelector('[data-a="c3"]');
      const bonne = () => etat.v === 10 && Math.abs(etat.xL - OA) < 0.05;
      consigne(c1, `Choisis la lentille de 10 δ et place-la à ${OA} cm de l'objet.`, bonne, () => {
        c2.innerHTML = `<p class="lt-consigne">Déplace l'écran jusqu'à ce que l'image soit <b>nette</b> (± 1 mm pour finir), puis valide.</p>
          <div class="er-actions"><button type="button" class="btn-primary" data-a="nette">L'image est nette</button></div><div data-a="ret" aria-live="polite"></div>`;
        const ret = c2.querySelector('[data-a="ret"]');
        let err = 0;
        c2.querySelector('[data-a="nette"]').onclick = () => {
          if (!bonne()) { ret.innerHTML = `<p class="ph-msg">Remets la lentille de 10 δ à ${OA} cm de l'objet.</p>`; return; }
          if (!nette()) {
            err++;
            const im = image();
            ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> L'image est encore floue : ${etat.xE < im.xi ? 'éloigne' : 'rapproche'} l'écran de la lentille.</p>${err >= 2 ? '<p class="er-petit">Regarde la vue « Écran » : les bords de la lettre doivent être bien nets.</p>' : ''}</div>`;
            LT.defiler(ret); return;
          }
          c2.querySelector('[data-a="nette"]').disabled = true;
          ret.innerHTML = `<p class="ph-ok">✓ Image nette, écran à ${fmt(etat.xE, 1)} cm sur le banc.</p>`;
          mesures['xE' + OA] = etat.xE;
          suiteNette(c3, OA, deuxieme);
        };
        LT.defiler(c2);
      });
    }
    function suiteNette(z, OA, deuxieme) {
      const xi = OA + OPT.conjuguer(-OA, 10), OAi = xi - OA;
      const lectureOAi = {
        type: 'nombre', q: 'Calcule la distance OA′ entre la lentille et l\'écran.', label: 'OA′ =', unite: 'cm', aria: 'Distance OA′ en centimètres',
        verifier: v => (Math.abs(v - (mesures['xE' + OA] - OA)) <= 0.15 || Math.abs(v - OAi) <= 0.35) ? { ok: true }
          : Math.abs(v - mesures['xE' + OA]) <= 0.15 ? { diag: `${fmt(mesures['xE' + OA], 1)} cm est la position de l'écran sur le banc. OA′ est la distance de la lentille (à ${OA} cm) à l'écran : fais la différence.` }
          : { diag: `OA′ = position de l'écran − position de la lentille = ${fmt(mesures['xE' + OA], 1)} − ${OA}.` },
        remplir: i => { i.value = fmt(mesures['xE' + OA] - OA, 1); },
        solution: () => `OA′ = ${fmt(mesures['xE' + OA], 1)} − ${OA} = ${fmt(mesures['xE' + OA] - OA, 1)} cm${deuxieme ? '' : ' (environ 13,3 cm)'}.`,
      };
      const parties = deuxieme ? [lectureOAi] : [
        { type: 'choix', q: 'Y a-t-il plusieurs positions de l\'écran qui donnent une image nette ?', options: [{ id: 'non', label: 'Non, une seule' }, { id: 'oui', label: 'Oui, plusieurs' }], bonne: 'non', melanger: false,
          indices: { oui: 'Déplace l\'écran de quelques millimètres de part et d\'autre : l\'image devient floue. Il n\'y a qu\'une position, en A′.' },
          solution: 'Une seule position de l\'écran donne une image nette : l\'écran doit être en A′, l\'image de A.' },
        { type: 'choix', q: 'Par rapport à l\'objet, l\'image sur l\'écran est :', options: [{ id: 'droite', label: 'droite (à l\'endroit)' }, { id: 'renversee', label: 'renversée (à l\'envers)' }], bonne: 'renversee', melanger: false,
          indices: { droite: 'Compare la lettre de l\'écran à celle de l\'objet : elle a tourné d\'un demi-tour, la tige est en bas.' },
          solution: 'L\'image est renversée : la lettre a tourné d\'un demi-tour.' },
        lectureOAi,
      ];
      questions(z, parties, () => {
        mesures['OAi' + OA] = mesures['xE' + OA] - OA;
        if (deuxieme) grandissement20(z);
        else conclure(`Une seule position de l'écran donne une image nette, en A′ : OA′ ≈ 13,3 cm. L'image est renversée.`);
      });
    }

    /* ----- 3. Taille de l'image et grandissement (lentille à 40 cm) ----- */
    function grandissement(z, OA) {
      z.innerHTML = '<p class="lt-li-aide">Garde l\'image nette sur l\'écran (lentille de 10 δ à 40 cm).</p>';
      const OAi = mesures['OAi' + OA] || 13.3;
      questions(z, [
        { type: 'nombre', q: 'Mesure la taille A′B′ de l\'image avec la règle de la vue « Écran ».', label: 'A′B′ =', unite: 'cm', aria: 'Taille de l\'image en centimètres',
          verifier: v => Math.abs(v - 1) <= 0.1 ? { ok: true } : Math.abs(v - 10) <= 1 ? { diag: 'La règle est graduée en centimètres : écris A′B′ en cm.' } : Math.abs(v - 3) <= 0.1 ? { diag: '3,0 cm est la taille de l\'objet AB. Mesure l\'image, sur l\'écran.' } : { diag: 'Lis la graduation au bout de la lettre : le 0 de la règle est sur l\'axe optique. Garde l\'image nette.' },
          remplir: i => { i.value = '1,0'; } },
        { type: 'nombre', q: 'Calcule le grandissement γ = A′B′ / AB (deux chiffres significatifs).', label: 'γ = A′B′ / AB =', calc: true, aria: 'Grandissement par les tailles',
          verifier: v => Math.abs(v - 1 / 3) <= 0.01 ? { ok: true } : Math.abs(v - 3) <= 0.05 ? { diag: 'γ = A′B′ / AB : la taille de l\'image divisée par la taille de l\'objet.' } : { diag: 'γ = A′B′ / AB = 1,0 / 3,0.' },
          remplir: i => { i.value = '0,33'; }, solution: 'γ = A′B′ / AB = 1,0 / 3,0 ≈ 0,33.' },
        { type: 'nombre', q: `Calcule aussi OA′ / OA, avec OA = 40 cm et ta mesure OA′ = ${fmt(OAi, 1)} cm (deux chiffres significatifs).`, label: 'OA′ / OA =', calc: true, aria: 'Rapport des distances',
          verifier: v => Math.abs(v - OAi / 40) <= 0.01 ? { ok: true } : Math.abs(v - 40 / OAi) <= 0.05 ? { diag: 'Divise OA′ par OA : la distance de l\'image par la distance de l\'objet.' } : { diag: `OA′ / OA = ${fmt(OAi, 1)} / 40.` },
          remplir: i => { i.value = LT.sig(OAi / 40, 2); }, solution: `OA′ / OA = ${fmt(OAi, 1)} / 40 ≈ ${LT.sig(OAi / 40, 2)} : la même valeur que A′B′ / AB.` },
      ], () => conclure('γ = A′B′ / AB = OA′ / OA ≈ 0,33 : γ < 1, l\'image est plus petite que l\'objet.'));
    }
    // lentille à 20 cm : γ = 1
    function grandissement20(z) {
      questions(z, [
        { type: 'nombre', q: 'Mesure la taille A′B′ de l\'image.', label: 'A′B′ =', unite: 'cm', aria: 'Taille de l\'image en centimètres',
          verifier: v => Math.abs(v - 3) <= 0.1 ? { ok: true } : Math.abs(v - 30) <= 1 ? { diag: 'La règle est graduée en centimètres : écris A′B′ en cm.' } : { diag: 'Lis la graduation au bout de la lettre : le 0 de la règle est sur l\'axe optique. Garde l\'image nette.' },
          remplir: i => { i.value = '3,0'; } },
        { type: 'nombre', q: 'Calcule le grandissement γ = A′B′ / AB.', label: 'γ =', aria: 'Grandissement',
          verifier: v => Math.abs(v - 1) <= 0.03 ? { ok: true } : { diag: 'γ = A′B′ / AB = 3,0 / 3,0.' },
          remplir: i => { i.value = '1'; }, solution: 'γ = A′B′ / AB = 3,0 / 3,0 = 1, et OA′ / OA = 20 / 20 = 1.' },
      ], () => conclure('OA′ = OA = 20 cm et γ = 1 : l\'image, renversée, a la même taille que l\'objet.'));
    }

    /* ----- 5. Bilan ----- */
    function fin() {
      k = ETAPES.length; marquer();
      SOM.marquer({ fait: true });
      $e.innerHTML = `<h4 class="lt-etape-titre">${k + 1}. Bilan</h4>
        <div class="cle lt-bilan"><p><b class="cle-titre">Grandissement.</b> γ = A′B′ / AB = OA′ / OA.</p>
          <p>Pour une position de la lentille, une seule position de l'écran donne une image nette : l'écran est en A′. L'image réelle est renversée ; γ > 1 : elle est plus grande que l'objet, γ < 1 : plus petite.</p></div>
        <p class="lt-li-aide">Essaie librement : les autres lentilles, d'autres positions, et la lentille de 10 δ à moins de 10 cm de l'objet.</p>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_4_simulation.html">Module 4 : l'œil →</a></div>`;
      $e.querySelector('[data-a="re"]').onclick = () => { k = 0; Object.keys(mesures).forEach(x => delete mesures[x]); etat.v = 10; etat.xL = 25; etat.xE = 70; tout(); entrer(); };
      LT.amener($e, 0.4);
    }

    tout();
    entrer();
    LT.bancEnCours = { etat, image, nette, regler, tout };        // utile pour vérifier l'application
    return LT.bancEnCours;
  }

  Object.assign(LT, { simulateurBanc });
})();
