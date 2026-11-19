/* ============================================================
   Module 4 : le modèle de l'œil (simulation)
   LT.simulateurOeil(zone)
   Partie 1 : coupe de l'œil (iris et pupille, cristallin, rétine) à côté du modèle de l'œil réduit
     (diaphragme, lentille convergente, écran) ; l'élève relie chaque partie de l'œil à son modèle
     (glisser l'étiquette, ou toucher l'étiquette puis l'élément du modèle).
   Partie 2 : accommodation. La rétine est à 17 mm du cristallin. L'objet s'éloigne ou se rapproche
     (25 cm à « l'infini ») ; l'élève règle la distance focale du cristallin (± 0,1 mm) pour que
     l'image se forme sur la rétine ; la vergence v = 1 / f′ s'affiche.
     Déroulé : infini (f′ = 17,0 mm), 1 m (16,7 mm), 25 cm (15,9 mm) ; f′ diminue, v augmente ; bilan.
   Position de l'image : relation de conjugaison (OPT.conjuguer), calcul interne jamais affiché.
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, fmt = LT.fmt;
  const RETINE = 17;                                               // distance cristallin-rétine (mm)
  const DISTANCES = [25, 30, 40, 50, 75, 100, 150, 200, 300, 500, 1000, Infinity];   // cm
  const texteDist = d => (d === Infinity ? 'à l\'infini (très loin)' : d >= 100 ? `${fmt(d / 100)} m` : `${d} cm`);
  // distance focale qui donne une image nette sur la rétine (mm) ; d en cm
  const fNette = d => (d === Infinity ? RETINE : 1 / (1 / RETINE + 1 / (d * 10)));
  let compteur = 0;

  /* ============================================================
     PARTIE 1 : relier l'œil et son modèle
     ============================================================ */
  function coupeOeil(zone) {
    const S = OPT.scene(zone, { largeur: 360, hauteur: 250, aria: 'Coupe de l\'œil : iris et pupille, cristallin, rétine' });
    const C = [30, 0], R = 100;
    S.cercle('milieux', C, R, 'lt-oeil-globe');
    // cornée (bombée à l'avant)
    const cornee = []; for (let a = 118; a <= 242; a += 4) cornee.push(V.add([-40, 0], V.mul(V.dir(a), 45)));
    S.poly('milieux', cornee, 'lt-oeil-cornee');
    // nerf optique
    S.poly('milieux', [[126, -11], [172, -11], [172, 11], [126, 11]], 'lt-oeil-nerf');
    // rétine (fond de l'œil)
    const ret = []; for (let a = -62; a <= 62; a += 2) ret.push(V.add(C, V.mul(V.dir(a), R - 3)));
    ret.forEach((p, i) => { if (i) S.ligne('deco', ret[i - 1], p, 'lt-oeil-retine'); });
    // iris (la pupille est le trou au centre) et cristallin
    S.ligne('deco', [-56, 44], [-56, 13], 'lt-oeil-iris');
    S.ligne('deco', [-56, -44], [-56, -13], 'lt-oeil-iris');
    const cri = []; for (let a = 0; a < 360; a += 10) cri.push([-36 + 12 * Math.cos(a * Math.PI / 180), 30 * Math.sin(a * Math.PI / 180)]);
    S.poly('deco', cri, 'lt-oeil-cristallin');
    // deux rayons qui entrent par la pupille et se rejoignent sur la rétine
    S.rayon('rayons', [-170, 10], [-36, 10], { fleche: 1, cls: 'opt-fin' });
    S.rayon('rayons', [-36, 10], [127, 0], { cls: 'opt-fin' });
    S.rayon('rayons', [-170, -10], [-36, -10], { fleche: 1, cls: 'opt-fin' });
    S.rayon('rayons', [-36, -10], [127, 0], { cls: 'opt-fin' });
    // noms des parties
    const nom = (p, q, t, ancre) => { S.ligne('textes', p, q, 'lt-repere'); S.texte('textes', q, t, { taille: 13, ancre, cls: 'lt-g-nom' }); };
    nom([-56, 34], [-110, 82], 'iris', 'end');
    nom([-58, 2], [-130, 42], 'pupille', 'end');
    nom([-36, -26], [-80, -92], 'cristallin', 'middle');
    nom([118, -50], [120, -110], 'rétine', 'middle');
    return S;
  }
  function modeleOeil(zone) {
    const S = OPT.scene(zone, { largeur: 360, hauteur: 250, aria: 'Modèle de l\'œil réduit : diaphragme, lentille convergente, écran' });
    S.ligne('fond', [-175, 0], [175, 0], 'opt-axe');
    S.ligne('deco', [-135, 70], [-135, 18], 'lt-diaphragme');
    S.ligne('deco', [-135, -70], [-135, -18], 'lt-diaphragme');
    S.lentille({ O: [-50, 0], h: 72, foyers: false, noms: false, axe: false });
    S.poly('deco', [[118, -84], [128, -84], [128, 84], [118, 84]], 'lt-ecran');
    S.texte('textes', [-135, -92], 'diaphragme', { taille: 13, cls: 'lt-g-nom' });
    S.texte('textes', [-50, -98], 'lentille', { taille: 13, cls: 'lt-g-nom' });
    S.texte('textes', [-50, -114], 'convergente', { taille: 13, cls: 'lt-g-nom' });
    S.texte('textes', [123, -100], 'écran', { taille: 13, cls: 'lt-g-nom' });
    return S;
  }
  function relier(carte, fini) {
    carte.innerHTML = `<span class="er-badge">PARTIE 1</span><h3 class="lt-sit-titre" style="margin-top:8px">Le modèle de l'œil réduit</h3>
      <p class="er-contexte" style="margin-top:6px">On modélise l'œil par un <b>diaphragme</b>, une <b>lentille convergente</b> et un <b>écran</b>. Relie chaque partie de l'œil à son modèle.</p>
      <div class="lt-deux"><figure class="lt-vue"><figcaption>Coupe de l'œil</figcaption><div data-a="oeil"></div></figure>
        <figure class="lt-vue"><figcaption>Œil réduit (modèle)</figcaption><div data-a="mod"></div></figure></div>
      <p class="lt-aide-t">Glisse chaque étiquette sur l'élément du modèle qui lui correspond, ou touche une étiquette puis touche l'élément.</p>
      <div class="lt-bac" data-a="bac"></div><div data-a="ret" aria-live="polite"></div>
      <div class="lt-aide" hidden data-a="aide"><button type="button" class="btn-small">Afficher la réponse</button></div>`;
    coupeOeil(carte.querySelector('[data-a="oeil"]'));
    const S = modeleOeil(carte.querySelector('[data-a="mod"]'));
    const ret = carte.querySelector('[data-a="ret"]'), aide = carte.querySelector('[data-a="aide"]');
    const BON = { pupille: 'diaph', cristallin: 'lentille', retine: 'ecran' };
    const NOMS = { pupille: 'pupille (et iris)', cristallin: 'cristallin', retine: 'rétine' };
    const POS = { diaph: [-135, 108], lentille: [-50, 88], ecran: [123, 104] };
    const DIAG = {
      pupille: 'La pupille est un trou de taille réglable (grâce à l\'iris) : elle fait entrer plus ou moins de lumière. C\'est le diaphragme.',
      cristallin: 'Le cristallin dévie la lumière comme une lentille : c\'est la lentille convergente.',
      retine: 'La rétine, au fond de l\'œil, reçoit l\'image : c\'est l\'écran.',
    };
    let restants = 3, erreurs = 0, termine = false;
    const poser = id => S.etiquette('textes', POS[BON[id]], NOMS[id], { taille: 13 });
    function terminer(vue) {
      termine = true; aide.hidden = true;
      ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour"><p><b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : (erreurs ? 'C\'est juste.' : 'Juste !')}</b> La pupille (trou réglable par l'iris) est le <b>diaphragme</b>, le cristallin est la <b>lentille convergente</b>, la rétine est l'<b>écran</b>.</p></div>`;
      fini();
    }
    const et = OPT.etiquettes(S, carte.querySelector('[data-a="bac"]'), {
      items: LT.melanger(Object.keys(BON)).map(id => ({ id, html: NOMS[id] })),
      cibles: () => [{ id: 'diaph', a: [-135, -75], b: [-135, 75] }, { id: 'lentille', a: [-50, -75], b: [-50, 75] }, { id: 'ecran', a: [123, -84], b: [123, 84] }],
      surDepot(id, c) {
        if (termine) return false;
        if (c.id !== BON[id]) {
          erreurs++;
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${DIAG[id]}</p>${erreurs >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p>' : ''}</div>`;
          if (erreurs >= 2) aide.hidden = false;
          LT.defiler(ret);
          return false;
        }
        poser(id); ret.innerHTML = `<p class="ph-ok">✓ ${NOMS[id]}</p>`;
        if (--restants === 0) terminer(false);
        return true;
      },
    });
    aide.querySelector('button').onclick = () => {
      if (termine) return;
      Object.keys(BON).forEach(id => { if (!carte.querySelector('.opt-puce[data-id="' + id + '"]').hidden) poser(id); });
      et.vider(); terminer(true);
    };
  }

  /* ============================================================
     PARTIE 2 : accommodation
     ============================================================ */
  function accommodation(carte) {
    const id = ++compteur;
    const etat = { i: DISTANCES.length - 1, f: 16.0 };
    const dist = () => DISTANCES[etat.i];
    const nette = () => Math.abs(etat.f - fNette(dist())) <= 0.05 + 1e-9;
    carte.innerHTML = `<span class="er-badge">PARTIE 2</span><h3 class="lt-sit-titre" style="margin-top:8px">L'accommodation</h3>
      <p class="er-contexte" style="margin-top:6px">La rétine est à <b>17 mm</b> du cristallin : cette distance ne change pas. Pour voir net, l'image doit se former <b>sur la rétine</b>.</p>
      <div class="lt-manip lt-manip-oeil">
        <div class="lt-manip-fig">
          <div class="lt-fig lt-fig-oeil"></div>
          <p class="lt-echelle">Œil réduit vu en coupe ; les distances de l'objet ne sont pas à l'échelle.</p>
          <div class="lt-curseurs">
            <label class="lt-curseur"><span>Distance de l'objet : <b data-a="dT"></b></span>
              <input type="range" min="0" max="${DISTANCES.length - 1}" step="1" data-a="d" aria-label="Distance de l'objet"></label>
            <div class="lt-curseur"><label for="lt-f-${id}">Distance focale du cristallin : <b data-a="fT"></b></label>
              <div class="lt-curseur-l"><input type="range" id="lt-f-${id}" min="150" max="175" step="1" data-a="f"><span data-a="fB"></span></div></div>
          </div>
          <div class="lt-mesures" aria-live="polite" data-a="mes"></div>
          <div class="lt-retine-vue"><figure class="lt-vue lt-vue-petite"><figcaption>Image sur la rétine</figcaption><div data-a="vue"></div></figure></div>
        </div>
        <div class="lt-manip-panneau"><ol class="lt-deroule lt-deroule-court" data-a="deroule"></ol><div class="lt-etape" data-a="etape"></div></div>
      </div>`;
    const $ = a => carte.querySelector(`[data-a="${a}"]`);
    const S = OPT.scene(carte.querySelector('.lt-fig-oeil'), { largeur: 640, hauteur: 250, aria: 'Œil réduit : objet, diaphragme, cristallin et rétine ; rayons issus de l\'objet' });
    // repère : cristallin en x = 20, 14 unités par mm dans l'œil
    const XC = 20, KMM = 14, XR = XC + RETINE * KMM, HP = 46;
    function dessiner() {
      ['fond', 'deco', 'rayons', 'textes'].forEach(n => S.vider(n));
      S.ligne('fond', [-320, 0], [320, 0], 'opt-axe');
      // œil réduit : diaphragme, cristallin (lentille convergente), rétine (écran)
      S.ligne('deco', [XC - 14, 90], [XC - 14, HP + 6], 'lt-diaphragme');
      S.ligne('deco', [XC - 14, -90], [XC - 14, -HP - 6], 'lt-diaphragme');
      S.lentille({ O: [XC, 0], h: 84, foyers: false, noms: false, axe: false });
      S.poly('deco', [[XR, -100], [XR + 8, -100], [XR + 8, 100], [XR, 100]], 'lt-ecran');
      S.texte('textes', [XC, -112], 'cristallin', { taille: 12, cls: 'lt-g-nom' });
      S.texte('textes', [XR + 4, -112], 'rétine', { taille: 12, cls: 'lt-g-nom' });
      S.ligne('textes', [XC, -96], [XR, -96], 'lt-cote');
      S.texte('textes', [(XC + XR) / 2, -86], '17 mm', { taille: 12, cls: 'lt-g-txt' });
      // objet (point A sur l'axe) et rayons incidents
      const d = dist(), hs = [HP, 0, -HP];
      let A = null;
      if (d === Infinity) {
        hs.forEach(h => S.rayon('rayons', [-310, h], [XC, h], { fleche: 1, cls: 'opt-fin' }));
        S.texte('textes', [-300, 70], 'objet à l\'infini : rayons parallèles', { taille: 12, cls: 'lt-g-txt', ancre: 'start' });
      } else {
        // distance dessinée : 25 cm → 120 unités, 10 m → 300 unités (échelle logarithmique)
        const D = 120 + 180 * Math.log10(d / 25) / Math.log10(40);
        A = [XC - D, 0];
        S.fleche('textes', A, [A[0], 60], 'opt-objet');
        S.texte('textes', [A[0], 74], `objet à ${texteDist(d)}`, { taille: 12, cls: 'lt-g-txt' });
        hs.forEach(h => S.rayon('rayons', A, [XC, h], { fleche: 1, cls: 'opt-fin' }));
      }
      // dans l'œil : les rayons convergent en A′ (calcul interne), puis atteignent la rétine
      const OAi = d === Infinity ? etat.f : OPT.conjuguer(-d * 10, etat.f);   // mm
      const xi = XC + OAi * KMM;
      hs.forEach(h => {
        const dir = V.norm(V.sub([xi, 0], [XC, h]));
        const t = (XR - XC) / dir[0];
        S.rayon('rayons', [XC, h], V.add([XC, h], V.mul(dir, t)), { cls: 'opt-fin' });
      });
      // tache sur la rétine
      const tache = 2 * HP * Math.abs(XR - xi) / (xi - XC);
      if (nette()) S.cercle('textes', [XR, 0], 4.5, 'opt-pose');
      else S.ligne('textes', [XR - 1, -tache / 2], [XR - 1, tache / 2], 'lt-tache-trait');
      return { OAi };
    }
    // vue « image sur la rétine » : la lettre, nette ou floue
    const vueS = OPT.scene($('vue'), { largeur: 160, hauteur: 120, aria: 'Image sur la rétine' });
    vueS.poly('fond', [[-80, -60], [80, -60], [80, 60], [-80, 60]], 'lt-vue-fond');
    const defs = OPT.svgEl('defs', null, vueS.svg);
    const filtre = OPT.svgEl('filter', { id: 'lt-flou-oeil-' + id, filterUnits: 'userSpaceOnUse', x: -80, y: -60, width: 160, height: 120 }, defs);
    const flou = OPT.svgEl('feGaussianBlur', { stdDeviation: 0 }, filtre);
    const gImg = OPT.svgEl('g', { filter: `url(#lt-flou-oeil-${id})` }, vueS.calque('rayons'));
    LT.lettre(gImg, 0, -36, 72, true, 'lt-lettre');

    // commandes
    const $d = $('d'), $f = $('f');
    $d.value = etat.i; $f.value = Math.round(etat.f * 10);
    $d.oninput = () => { etat.i = +$d.value; maj(); };
    $f.oninput = () => { etat.f = +$f.value / 10; maj(); };
    const fb = LT.el('span', 'lt-pm');
    [['−0,1 mm', -1], ['+0,1 mm', 1]].forEach(([t, k]) => {
      const b = LT.el('button', 'btn-secondary opt-fl lt-pm-b', t);
      b.type = 'button'; b.setAttribute('aria-label', `Distance focale : ${k < 0 ? 'moins' : 'plus'} 0,1 mm`);
      b.onclick = () => { etat.f = Math.max(15, Math.min(17.5, Math.round(etat.f * 10 + k) / 10)); $f.value = Math.round(etat.f * 10); maj(); };
      fb.appendChild(b);
    });
    $('fB').appendChild(fb);
    function maj() {
      const r = dessiner(), d = dist();
      $('dT').textContent = texteDist(d);
      $('fT').textContent = fmt(etat.f, 1) + ' mm';
      const fm = etat.f / 1000, v = 1 / fm;
      const ou = nette() ? '<b>nette sur la rétine</b> ✓' : r.OAi > RETINE ? 'floue : elle se forme <b>derrière</b> la rétine' : 'floue : elle se forme <b>devant</b> la rétine';
      $('mes').innerHTML = `<span>f′ = ${fmt(etat.f, 1)} mm = ${fmt(fm, 4)} m</span><span>v = 1 / f′ = 1 / ${fmt(fm, 4)} ≈ <b>${fmt(v, 1)} δ</b></span><span>Image : ${ou}</span>`;
      // flou : tache sur la rétine (mm), vue agrandie
      const tache = 6 * Math.abs(r.OAi - RETINE) / r.OAi;
      flou.setAttribute('stdDeviation', nette() ? 0 : String(Math.round(Math.min(14, Math.max(1.5, tache * 30)) * 100) / 100));
      if (verif) verif();
    }

    /* ----- Déroulé guidé ----- */
    const ETAPES = [
      { t: 'Objet à l\'infini', d: Infinity },
      { t: 'Objet à 1 m', d: 100 },
      { t: 'Objet à 25 cm', d: 25 },
      { t: 'Quand l\'objet se rapproche', q: true },
    ];
    const ol = $('deroule');
    ol.innerHTML = ETAPES.map(e => `<li><span>${e.t}</span></li>`).join('') + '<li><span>Bilan</span></li>';
    const lis = Array.from(ol.children);
    const $e = $('etape');
    let k = 0, verif = null;
    const reglages = [];
    function marquer() { lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); }); }
    function entrer() {
      verif = null; marquer();
      const E = ETAPES[k];
      $e.innerHTML = `<h4 class="lt-etape-titre">${k + 1}. ${E.t}</h4><div class="lt-etape-corps"></div>`;
      const z = $e.querySelector('.lt-etape-corps');
      if (E.q) questions(z); else regler(z, E.d);
      if (k > 0) LT.amener(LT.surOrdi() ? carte.querySelector('.lt-manip') : $e, 0.4);
    }
    function conclure(texte) {
      verif = null;
      const d = LT.el('div', 'lt-conclusion', `<div class="callout-success er-retour"><p><b class="er-ok">Bilan de l'étape.</b> ${texte}</p></div>
        <div class="er-actions"><button type="button" class="btn-primary">${k < ETAPES.length - 1 ? 'Suite →' : 'Voir le bilan →'}</button></div>`);
      $e.appendChild(d);
      d.querySelector('button').onclick = () => { k++; if (k < ETAPES.length) entrer(); else fin(); };
      LT.defiler(d);
    }
    // régler la distance de l'objet, puis le cristallin : la consigne se coche quand l'image est nette
    function regler(z, d) {
      const fn = Math.round(fNette(d) * 10) / 10, v = 1000 / fn;
      const p1 = LT.el('p', 'lt-consigne', `Règle la distance de l'objet : ${texteDist(d)}.`);
      const p2 = LT.el('p', 'lt-consigne lt-avenir', 'Règle la distance focale du cristallin pour que l\'image soit nette sur la rétine.');
      z.appendChild(p1); z.appendChild(p2);
      verif = () => {
        const bonneD = dist() === d;
        p1.classList.toggle('lt-faite', bonneD); p1.innerHTML = (bonneD ? '✓ ' : '') + `Règle la distance de l'objet : ${texteDist(d)}.`;
        p2.classList.toggle('lt-avenir', !bonneD);
        if (bonneD && nette()) {
          verif = null;
          p2.classList.add('lt-faite'); p2.innerHTML = '✓ Règle la distance focale du cristallin pour que l\'image soit nette sur la rétine.';
          reglages.push(fn);
          conclure(`${d === Infinity ? 'Objet à l\'infini : le cristallin est <b>au repos</b>, ' : ''}f′ = ${fmt(fn, 1)} mm, v = 1 / ${fmt(fn / 1000, 4)} ≈ ${fmt(v, 1)} δ.`);
        }
      };
      verif();
    }
    function questions(z) {
      z.innerHTML = `<div class="lt-donnees"><span>Objet à l'infini : f′ = 17,0 mm, v ≈ 58,8 δ</span><span>Objet à 1 m : f′ = 16,7 mm, v ≈ 59,9 δ</span><span>Objet à 25 cm : f′ = 15,9 mm, v ≈ 62,9 δ</span></div>`;
      const d = LT.el('div');
      z.appendChild(d);
      LT.question(d, { parties: [
        { type: 'choix', q: 'Quand l\'objet se rapproche, la distance focale f′ du cristallin :', options: [{ id: 'dim', label: 'diminue' }, { id: 'aug', label: 'augmente' }, { id: 'pareil', label: 'ne change pas' }], bonne: 'dim', melanger: false,
          indices: { aug: 'Relis tes réglages : 17,0 mm, puis 16,7 mm, puis 15,9 mm.', pareil: 'La rétine ne bouge pas : pour que l\'image reste sur la rétine, le cristallin doit changer.' },
          solution: 'La distance focale du cristallin diminue : 17,0 mm, puis 16,7 mm, puis 15,9 mm.' },
        { type: 'choix', q: 'Et sa vergence v = 1 / f′ :', options: [{ id: 'aug', label: 'augmente : le cristallin est plus convergent' }, { id: 'dim', label: 'diminue : le cristallin est moins convergent' }], bonne: 'aug', melanger: false, colonne: true,
          indices: { dim: 'v = 1 / f′ : quand f′ diminue, v augmente.' },
          solution: 'v augmente (58,8 δ, puis 59,9 δ, puis 62,9 δ) : le cristallin est plus convergent.' },
      ] }, { fin: () => conclure('Pour garder l\'image sur la rétine quand l\'objet se rapproche, la distance focale du cristallin diminue et sa vergence augmente.') }, 'manip');
    }
    function fin() {
      k = ETAPES.length; marquer();
      SOM.marquer({ fait: true });
      $e.innerHTML = `<h4 class="lt-etape-titre">${k + 1}. Bilan</h4>
        <div class="cle lt-bilan"><p><b class="cle-titre">Accommodation.</b> Pour voir un objet à l'infini, le cristallin est au repos ; l'image se forme sur la rétine. Si l'objet se rapproche, pour que l'image reste sur la rétine, l'œil doit <b>accommoder</b> : le cristallin se déforme pour être plus convergent. La distance focale du cristallin diminue.</p></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="../index.html">Accueil de l'application</a></div>`;
      $e.querySelector('[data-a="re"]').onclick = () => { k = 0; reglages.length = 0; etat.i = DISTANCES.length - 1; etat.f = 16; $d.value = etat.i; $f.value = 160; maj(); entrer(); };
      LT.amener($e, 0.4);
    }
    maj();
    entrer();
    LT.oeilEnCours = { etat, nette, fNette, maj, DISTANCES };   // utile pour vérifier l'application
  }

  function simulateurOeil(zone) {
    zone.innerHTML = '<div class="er-card" data-a="p1"></div><div class="er-card" data-a="p2"></div>';
    relier(zone.querySelector('[data-a="p1"]'), () => {});
    accommodation(zone.querySelector('[data-a="p2"]'));
  }

  Object.assign(LT, { simulateurOeil, fNette });
})();
