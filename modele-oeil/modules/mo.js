/* ============================================================
   Moteur de l'application « Modèle de l'œil »
   (Physique · Lycée ; la manipulation et le simulateur viennent du module 3
   « L'œil » de « Image par une lentille convergente » (lentilles/), déplacés
   sans changement ; navigation commune assets/sommaire.js, figures avec
   l'outil OPT de assets/optique.js)

   MO.PLAN                          plan de l'application (sommaire, accueil, progression)
   MO.fmt(v, dec)                   nombre écrit à la française (2,3 ; −0,30 ; 1 000)
   MO.melanger(t), MO.defiler(e)    outils (repris de lentilles/modules/lt.js)
   MO.lettre(parent, x, y, taille, renversee, cls)   lettre « d » (image sur la rétine)
   MO.simulateurOeil(zone)          module 1 : relier l'œil et son modèle (oeil.js)
   MO.simulateurVision(zone)        module 2 : accommodation et correction de la vision (vision.js)

   Progression : « modele-oeil-progression ». Au chargement, l'état des anciennes pages
   module_3a_manip et module_3b_simulation de « lentilles-progression » est recopié
   (migration silencieuse) dans module_1_manip et module_2_simulation.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Le modèle de l\'œil réduit', desc: 'Relier les parties de l\'œil (pupille et iris, cristallin, rétine) au diaphragme, à la lentille convergente et à l\'écran',
      parties: [{ nom: 'Le modèle de l\'œil réduit', entrainement: 'module_1_manip', noms: { entrainement: 'Manipulation : le modèle de l\'œil réduit' } }] },
    { n: 2, titre: 'Voir net : accommoder, corriger', desc: 'Accommodation, œil myope, hypermétrope, presbytie et correction par des lunettes',
      parties: [{ nom: 'Voir net : accommoder, corriger', simulation: 'module_2_simulation', noms: { simulation: 'Simulateur : accommodation et correction de la vision' } }] },
  ];

  /* ---------- Migration de la progression enregistrée dans lentilles/ (pages déplacées) ---------- */
  // ancienne page de lentilles/ → page de modele-oeil/ ; on garde le meilleur des deux (fait, meilleure note)
  const ANCIENNES = { module_3a_manip: 'module_1_manip', module_3b_simulation: 'module_2_simulation' };
  try {
    const ancien = JSON.parse(localStorage.getItem('lentilles-progression') || 'null');
    if (ancien && ancien.pages) {
      const prog = JSON.parse(localStorage.getItem('modele-oeil-progression') || 'null') || { pages: {} };
      prog.pages = prog.pages || {};
      let change = false;
      Object.keys(ANCIENNES).forEach(a => {
        const v = ancien.pages[a];
        if (!v) return;
        const cle = ANCIENNES[a], p = prog.pages[cle] || {};
        if (v.fait && !p.fait) { p.fait = true; change = true; }
        if (v.note != null && (p.note == null || v.note > p.note)) { p.note = v.note; change = true; }
        prog.pages[cle] = p;
      });
      if (change) localStorage.setItem('modele-oeil-progression', JSON.stringify(prog));
    }
  } catch (e) { /* stockage indisponible : rien à migrer */ }

  SOM.init({ nom: 'Modèle de l\'œil', id: 'modele-oeil', plan: PLAN });

  /* ============================================================
     NOMBRES ET OUTILS (repris de lentilles/modules/lt.js)
     ============================================================ */
  const MOINS = '−';
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000 (dec : nombre de décimales imposé)
  function fmt(v, dec) {
    if (dec == null) {
      const r = Math.round(v * 1e9) / 1e9;
      let s = String(+r.toPrecision(6));
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? MOINS : '') + (d ? e + ',' + d : e);
    }
    const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // tableau mélangé (copie)
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // amène e à l'écran sans sauter dans la page
  const defiler = e => setTimeout(() => e && e.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);

  // lettre « d » (image sur la rétine), dessinée dans parent (SVG) : centre (x, y), hauteur taille, renversée ou non
  function lettre(parent, x, y, taille, renversee, cls) {
    const g = OPT.svgEl('g', { class: cls || 'mo-lettre', transform: `translate(${x} ${y}) scale(${taille})${renversee ? ' rotate(180)' : ''}` }, parent);
    OPT.svgEl('line', { x1: 0.18, y1: -1, x2: 0.18, y2: 0, 'stroke-width': 0.15, 'stroke-linecap': 'butt' }, g);
    OPT.svgEl('circle', { cx: -0.1, cy: -0.27, r: 0.21, 'stroke-width': 0.13, fill: 'none' }, g);
    return g;
  }

  window.MO = { PLAN, fmt, melanger, defiler, lettre };
})();
