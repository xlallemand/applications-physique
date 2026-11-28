/* ============================================================
   Module 1 : le modèle de l'œil réduit (manipulation)
   MO.simulateurOeil(zone)
   Coupe de l'œil (iris et pupille, cristallin, rétine) à côté du modèle de l'œil réduit
   (diaphragme, lentille convergente, écran) ; l'élève relie chaque partie de l'œil à son modèle
   (glisser l'étiquette, ou toucher l'étiquette puis l'élément du modèle).
   Un seul écran, sans défilement : figures à gauche, panneau à droite (téléphone : figures en haut).
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V;

  /* ============================================================
     PARTIE 1 : relier l'œil et son modèle
     ============================================================ */
  function coupeOeil(zone) {
    const S = OPT.scene(zone, { largeur: 360, hauteur: 250, aria: 'Coupe de l\'œil : iris et pupille, cristallin, rétine' });
    const C = [30, 0], R = 100;
    S.cercle('milieux', C, R, 'mo-oeil-globe');
    // cornée (bombée à l'avant)
    const cornee = []; for (let a = 118; a <= 242; a += 4) cornee.push(V.add([-40, 0], V.mul(V.dir(a), 45)));
    S.poly('milieux', cornee, 'mo-oeil-cornee');
    // nerf optique
    S.poly('milieux', [[126, -11], [172, -11], [172, 11], [126, 11]], 'mo-oeil-nerf');
    // rétine (fond de l'œil)
    const ret = []; for (let a = -62; a <= 62; a += 2) ret.push(V.add(C, V.mul(V.dir(a), R - 3)));
    ret.forEach((p, i) => { if (i) S.ligne('deco', ret[i - 1], p, 'mo-oeil-retine'); });
    // iris (la pupille est le trou au centre) et cristallin
    S.ligne('deco', [-56, 44], [-56, 13], 'mo-oeil-iris');
    S.ligne('deco', [-56, -44], [-56, -13], 'mo-oeil-iris');
    const cri = []; for (let a = 0; a < 360; a += 10) cri.push([-36 + 12 * Math.cos(a * Math.PI / 180), 30 * Math.sin(a * Math.PI / 180)]);
    S.poly('deco', cri, 'mo-oeil-cristallin');
    // deux rayons qui entrent par la pupille et se rejoignent sur la rétine
    S.rayon('rayons', [-170, 10], [-36, 10], { fleche: 1, cls: 'opt-fin' });
    S.rayon('rayons', [-36, 10], [127, 0], { cls: 'opt-fin' });
    S.rayon('rayons', [-170, -10], [-36, -10], { fleche: 1, cls: 'opt-fin' });
    S.rayon('rayons', [-36, -10], [127, 0], { cls: 'opt-fin' });
    // noms des parties
    const nom = (p, q, t, ancre) => { S.ligne('textes', p, q, 'mo-repere'); S.texte('textes', q, t, { taille: 13, ancre, cls: 'mo-g-nom' }); };
    nom([-56, 34], [-110, 82], 'iris', 'end');
    nom([-58, 2], [-130, 42], 'pupille', 'end');
    nom([-36, -26], [-80, -92], 'cristallin', 'middle');
    nom([118, -50], [120, -110], 'rétine', 'middle');
    return S;
  }
  function modeleOeil(zone) {
    const S = OPT.scene(zone, { largeur: 360, hauteur: 250, aria: 'Modèle de l\'œil réduit : diaphragme, lentille convergente, écran' });
    S.ligne('fond', [-175, 0], [175, 0], 'opt-axe');
    S.ligne('deco', [-135, 70], [-135, 18], 'mo-diaphragme');
    S.ligne('deco', [-135, -70], [-135, -18], 'mo-diaphragme');
    S.lentille({ O: [-50, 0], h: 72, foyers: false, noms: false, axe: false });
    S.poly('deco', [[118, -84], [128, -84], [128, 84], [118, 84]], 'mo-ecran');
    S.texte('textes', [-135, -92], 'diaphragme', { taille: 13, cls: 'mo-g-nom' });
    S.texte('textes', [-50, -98], 'lentille', { taille: 13, cls: 'mo-g-nom' });
    S.texte('textes', [-50, -114], 'convergente', { taille: 13, cls: 'mo-g-nom' });
    S.texte('textes', [123, -100], 'écran', { taille: 13, cls: 'mo-g-nom' });
    return S;
  }
  function relier(carte, fini) {
    // un seul écran (comme le simulateur, vision.js) : les deux figures à gauche, le panneau à droite
    // (téléphone : figures en haut, panneau dessous)
    carte.innerHTML = `<div class="mo-vis">
      <div class="er-card mo-vis-tete">
        <div class="mo-entete-l"><span class="er-badge">MODULE 1 · MANIPULATION</span><h2 class="er-titre">Le modèle de l'œil réduit</h2></div>
        <span data-plein></span>
      </div>
      <div class="mo-vis-corps mo-man-corps">
        <div class="er-card mo-man-scene">
          <figure class="mo-man-vue"><figcaption>Coupe de l'œil</figcaption><div class="mo-man-fig" data-a="oeil"></div></figure>
          <figure class="mo-man-vue"><figcaption>Œil réduit (modèle)</figcaption><div class="mo-man-fig" data-a="mod"></div></figure>
        </div>
        <aside class="er-card mo-vis-panneau mo-man-panneau" aria-label="Relier">
          <p class="mo-man-contexte">On modélise l'œil par un <b>œil réduit</b> : un <b>diaphragme</b>, une <b>lentille convergente</b> et un <b>écran</b>. Relie chaque partie de l'œil à son modèle.</p>
          <p class="mo-aide-t">Glisse chaque étiquette sur l'élément du modèle qui lui correspond, ou touche une étiquette puis touche l'élément.</p>
          <div class="mo-bac" data-a="bac"></div><div data-a="ret" aria-live="polite"></div>
          <div class="mo-aide" hidden data-a="aide"><button type="button" class="btn-small">Afficher la réponse</button></div>
        </aside>
      </div>
    </div>`;
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
      items: MO.melanger(Object.keys(BON)).map(id => ({ id, html: NOMS[id] })),
      cibles: () => [{ id: 'diaph', a: [-135, -75], b: [-135, 75] }, { id: 'lentille', a: [-50, -75], b: [-50, 75] }, { id: 'ecran', a: [123, -84], b: [123, 84] }],
      surDepot(id, c) {
        if (termine) return false;
        if (c.id !== BON[id]) {
          erreurs++;
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${DIAG[id]}</p>${erreurs >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p>' : ''}</div>`;
          if (erreurs >= 2) aide.hidden = false;
          MO.defiler(ret);
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

  function simulateurOeil(zone) {
    relier(zone, () => SOM.marquer({ fait: true }));
  }

  Object.assign(MO, { simulateurOeil });
})();
