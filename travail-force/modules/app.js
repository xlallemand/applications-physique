/* ============================================================
   Travail d'une force — le simulateur (un seul écran)
   À charger après tf.js et scenes.js.

   Trois scènes, choisies par l'onglet ou par un défi :
     force   : chariot (vu de côté) ou wagon (vu de dessus, cinq personnages)
               tiré de A vers B ; F, AB, α réglables à tout moment
               (curseurs, pointe de F⃗ et point B à glisser, boutons ± 1° / ± 15°) ;
     chemins : F⃗ constante, cinq chemins de A à B (dont un tracé au doigt) ;
               travail de chaque portion et somme ;
     poids   : toboggan, piste de ski, escalier ou tracé libre ; z_A et z_B
               réglables (glisser A ou B) ; décomposition horizontale / verticale.
   « Lancer » anime le déplacement et remplit la jauge « énergie transmise »
   (Lecture / Pause, Pas à pas, ↺, vitesse × 0,5 / × 1 / × 2 ;
   prefers-reduced-motion : pas d'animation, avance par étapes).
   Panneau : Formule (W en direct ou « À trouver »), Graphiques (W = f(F),
   f(AB), f(α) : mesures relevées toutes seules), Chemins, Poids,
   À essayer (défis cochés tout seuls, questions avec diagnostics), Bilan.
   Angles toujours en degrés.
   API de test : TF.S (état), TF.regler(objet), TF.defisApi.
   ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const { fmt, cs, joules, deg, cosd, nature, vec, NB } = TF;
  const G = 9.81;                                        // intensité de la pesanteur (N/kg)
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  const W_ = n => `W<sub>AB</sub>(${vec(n)})`;
  const calc = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';

  /* ---------- État ---------- */
  const S = {
    scene: 'force', objet: 'chariot', F: 10, AB: 1, alpha: 0, pos: 0, masque: false,
    ch: { F: 10, alpha: 0, phi: 0, chemin: 'droit', libre: null, trace: null, avance: 0, anim: false, faits: {} },
    po: { m: 80, zA: 120, zB: 20, trajet: 'toboggan', libre: null, trace: null, avance: 0, decompose: false, faits: [], dernier: null },
    graphe: 'F', series: { F: { cle: '', pts: [] }, AB: { cle: '', pts: [] }, alpha: { cle: '', pts: [] } }, courbe: false,
    dernier: null, vit: 1,
  };
  TF.S = S;
  const Wforce = () => S.F * S.AB * cosd(S.alpha);
  const ABch = () => TF.B_CH[0];
  const Wch = () => S.ch.F * ABch() * cosd(S.ch.alpha);
  const Wpoids = () => S.po.m * G * (S.po.zA - S.po.zB);
  const cleForceCh = () => `${S.ch.F}|${S.ch.alpha}`;
  let defisApi = null;                                   // défis « À essayer » (créés plus bas)

  /* ---------- Écran ---------- */
  const zone = document.getElementById('tf-zone');
  const ONGLETS = [{ id: 'formule', nom: 'Formule' }, { id: 'graphes', nom: 'Graphiques', court: 'Graphes' }, { id: 'chemins', nom: 'Chemins' },
    { id: 'poids', nom: 'Poids' }, { id: 'essayer', nom: 'À essayer', court: 'Essayer' }, { id: 'bilan', nom: 'Bilan' }];
  const SCENE_DE = { formule: 'force', graphes: 'force', chemins: 'chemins', poids: 'poids' };
  const c = TF.cadre(zone, {
    bande: `<p class="tf-lecture" data-a="lecture" aria-live="off"></p>
      <div class="tf-jauge" data-a="jauge" role="img"><span class="tf-jauge-t">Énergie transmise</span>
        <span class="tf-jauge-barre"><span class="tf-jauge-rempli" data-a="rempli"></span><span class="tf-jauge-zero"></span></span>
        <span class="tf-jauge-v" data-a="jv"></span></div>`,
    bas: '',
    onglets: ONGLETS,
    sections: [
      { id: 'formule', html: sectionFormule() },
      { id: 'graphes', html: sectionGraphes() },
      { id: 'chemins', html: sectionChemins() },
      { id: 'poids', html: sectionPoids() },
      { id: 'essayer', html: `<div class="tf-seg tf-seg-plein" role="group" aria-label="Défis ou questions"><button type="button" data-vue="defis" aria-pressed="true">Défis</button><button type="button" data-vue="questions" aria-pressed="false">Questions</button></div>
          <div data-a="vDefis"></div><div data-a="vQuestions" hidden></div>` },
      { id: 'bilan', html: sectionBilan() },
    ],
    surOnglet: id => {
      if (SCENE_DE[id] && SCENE_DE[id] !== S.scene) changerScene(SCENE_DE[id]);
      if (id === 'graphes') graphe();
    },
  });
  const $ = c.$;
  const bas = $('bas') || (() => { const d = document.createElement('div'); d.className = 'tf-bas'; d.dataset.a = 'bas'; c.fig.after(d); return d; })();

  /* ---------- Contenu des onglets ---------- */
  function sectionFormule() {
    return `<div class="tf-seg tf-seg-plein" role="group" aria-label="Travail W"><button type="button" data-masque="0" aria-pressed="true">W montré</button><button type="button" data-masque="1" aria-pressed="false">W à trouver</button></div>
      <table class="tf-tab tf-grandeurs"><thead><tr><th>F</th><th>AB</th><th>α</th><th>cos α</th><th>W</th></tr></thead>
        <tbody><tr><td data-f="F"></td><td data-f="AB"></td><td data-f="alpha"></td><td data-f="cos"></td><td data-f="W" class="tf-case-w"></td></tr></tbody></table>
      <p class="tf-formule" data-f="formule"></p>
      <p class="tf-nature" data-f="nature"></p>
      <div data-f="trouver"></div>
      <p class="tf-lab">Cas particuliers</p>
      <div class="tf-seg" role="group" aria-label="Cas particuliers">${[0, 90, 180].map(a => `<button type="button" data-cas="${a}" aria-pressed="false">α = ${a}°</button>`).join('')}</div>
      <div class="tf-cas" data-f="cas"></div>`;
  }
  function sectionGraphes() {
    return `<div class="tf-seg tf-seg-plein" role="group" aria-label="Graphique affiché">
        <button type="button" data-gr="F" aria-pressed="true">W = f(F)</button><button type="button" data-gr="AB" aria-pressed="false">W = f(AB)</button><button type="button" data-gr="alpha" aria-pressed="false">W = f(α)</button></div>
      <p class="tf-petit" data-g="consigne"></p>
      <div class="tf-gr-corps"><svg class="tf-graphe" data-g="svg" viewBox="0 0 300 172" role="img" aria-label="Graphique du travail"></svg>
        <div class="tf-defile tf-gr-tab"><table class="tf-tab tf-mesures" data-g="tab"></table></div></div>
      <div class="tf-ligne"><label class="tf-cocher"><input type="checkbox" data-g="courbe"> <span data-g="courbeNom"></span></label><button type="button" class="btn-small" data-g="effacer">Effacer les mesures</button></div>
      <p class="tf-petit" data-g="conclu"></p>`;
  }
  function sectionChemins() {
    return `<p class="tf-petit">${vec('F')} reste la même pendant tout le trajet. Sur chaque portion : W<sub>i</sub> = F × ℓ<sub>i</sub> × cos α<sub>i</sub>.</p>
      <p class="tf-formule" data-c="total"></p>
      <div class="tf-defile tf-defile-court"><table class="tf-tab tf-mesures" data-c="portions"></table></div>
      <p class="tf-somme-l" data-c="somme"></p>
      <p class="tf-lab">Travail sur chaque chemin</p>
      <table class="tf-tab tf-mesures" data-c="faits"></table>
      <p class="tf-petit" data-c="conclu"></p>`;
  }
  function sectionPoids() {
    return `<p class="tf-formule" data-p="formule"></p>
      <p class="tf-nature" data-p="nature"></p>
      <label class="tf-cocher"><input type="checkbox" data-p="decompose"> Décomposer en déplacements horizontaux et verticaux</label>
      <div class="tf-decomp" data-p="decomp"></div>
      <p class="tf-lab">Trajets parcourus</p>
      <table class="tf-tab tf-mesures" data-p="faits"></table>`;
  }
  // bilan en trois parties (il tient ainsi dans le panneau, sans défilement)
  function sectionBilan() {
    return `<div class="tf-seg tf-seg-plein" role="group" aria-label="Partie du bilan"><button type="button" data-bil="0" aria-pressed="true">Formule</button><button type="button" data-bil="1" aria-pressed="false">Signe</button><button type="button" data-bil="2" aria-pressed="false">Chemin, poids</button></div>
      <div class="tf-bilan" data-bilan="0">
        <div class="cle"><p><b class="cle-titre">Travail d'une force.</b> Le travail ${W_('F')} d'une force constante ${vec('F')} est l'énergie qu'elle transmet au système au cours du déplacement de A à B. Il s'exprime en <b>joules (J)</b>.</p>
          <p class="tf-formule">${W_('F')} = F × AB × cos α</p>
          <p>F en N, AB en m ; α : angle entre ${vec('F')} et ${vec('AB')}, <b>en degrés</b> (calculatrice en degrés).</p></div>
        <div class="cle"><p>W est <b>proportionnel à F</b> et <b>à AB</b>. Il varie comme <b>cos α</b> : maximal pour α = 0° (W = F × AB), nul pour 90°, négatif et minimal pour 180° (W = −F × AB).</p></div></div>
      <div class="tf-bilan" data-bilan="1" hidden>
        <div class="cle"><p>α &lt; 90° : travail <b>moteur</b> (W &gt; 0) ;</p><p>α = 90° : travail <b>nul</b> ;</p><p>α &gt; 90° : travail <b>résistant</b> (W &lt; 0).</p></div>
        <div class="cle"><p>Une force <b>perpendiculaire au déplacement</b> ne travaille pas : réaction normale du support, poids sur un trajet horizontal, force dirigée vers le centre d'un mouvement circulaire.</p></div></div>
      <div class="tf-bilan" data-bilan="2" hidden>
        <div class="cle"><p>Pour une force constante, le travail <b>ne dépend pas du chemin suivi</b> : seulement des points A et B.</p></div>
        <div class="cle"><p><b class="cle-titre">Travail du poids.</b> Déplacement horizontal : W = 0 ; déplacement vertical : W = m g h.</p>
          <p class="tf-formule">${W_('P')} = m × g × (z<sub>A</sub> − z<sub>B</sub>)</p>
          <p>Descente (z<sub>A</sub> &gt; z<sub>B</sub>) : W &gt; 0, moteur ; montée : W &lt; 0, résistant.</p></div></div>`;
  }

  /* ---------- Commandes sous la figure (selon la scène) ---------- */
  const reglage = (id, nom, min, max, pas) => `<label class="tf-reglage"><span class="tf-reglage-l"><span>${nom}</span><b data-v="${id}"></b></span>
      <input type="range" data-r="${id}" min="${min}" max="${max}" step="${pas}" aria-label="${nom.replace(/<[^>]+>/g, '')}"></label>`;
  const tourner = `<span class="tf-tourner" role="group" aria-label="Tourner la force">${[-15, -1, 1, 15].map(d => `<button type="button" class="btn-secondary" data-tour="${d}" aria-label="Tourner la force de ${d > 0 ? 'plus' : 'moins'} ${Math.abs(d)} degré${Math.abs(d) > 1 ? 's' : ''}">${d > 0 ? '+' : '−'}${Math.abs(d)}°</button>`).join('')}</span>`;
  const anim = nom => `<span class="tf-anim"><button type="button" class="btn-primary tf-lire" data-act="lire">${reduit ? 'Étape ▸' : '▶ ' + nom}</button>${reduit ? '' : '<button type="button" class="btn-secondary" data-act="pas">Pas à pas</button>'}
      <button type="button" class="btn-secondary" data-act="re" aria-label="Recommencer">↺</button>${reduit ? '' : `<button type="button" class="btn-secondary tf-vit" data-act="vit" aria-label="Vitesse de l'animation">× ${fmt(S.vit, S.vit < 1 ? 1 : 0)}</button>`}</span>`;
  const seg = (attr, liste, actif, label) => `<span class="tf-seg" role="group" aria-label="${label}">${liste.map(x => `<button type="button" data-${attr}="${x.id}" aria-pressed="${x.id === actif}">${x.nom}</button>`).join('')}</span>`;
  function rendreBas() {
    if (S.scene === 'force') {
      bas.innerHTML = `<div class="tf-reglages">${reglage('F', 'F (N)', 0, 20, 1)}${reglage('AB', 'AB (m)', 0, 2, 0.1)}${reglage('alpha', 'α (°)', -180, 180, 1)}</div>
        <div class="tf-ctrl">${seg('objet', [{ id: 'chariot', nom: 'Chariot' }, { id: 'wagon', nom: 'Wagon' }], S.objet, 'Objet tiré')}${tourner}${anim('Lancer')}</div>`;
    } else if (S.scene === 'chemins') {
      bas.innerHTML = `<div class="tf-ctrl">${seg('chemin', TF.CHEMINS, S.ch.chemin, 'Chemin de A à B')}</div>
        <div class="tf-ctrl"><span class="tf-reglages tf-reglages-1">${reglage('chF', 'F (N)', 0, 20, 1)}</span>${tourner}${anim('Parcourir')}</div>`;
    } else {
      bas.innerHTML = `<div class="tf-ctrl">${seg('trajet', TF.TRAJETS, S.po.trajet, 'Trajet de A à B')}</div>
        <div class="tf-ctrl"><span class="tf-reglages">${reglage('m', 'm (kg)', 1, 120, 1)}${reglage('zA', 'z<sub>A</sub> (m)', 0, 150, 5)}${reglage('zB', 'z<sub>B</sub> (m)', 0, 150, 5)}</span>${anim('Lancer')}</div>`;
    }
    majCurseurs();
  }
  function majCurseurs() {
    const val = { F: [S.F, S.F + ' N'], AB: [S.AB, fmt(S.AB, 1) + ' m'], alpha: [S.alpha, deg(S.alpha)], chF: [S.ch.F, S.ch.F + ' N'],
      m: [S.po.m, S.po.m + ' kg'], zA: [S.po.zA, S.po.zA + ' m'], zB: [S.po.zB, S.po.zB + ' m'] };
    bas.querySelectorAll('[data-r]').forEach(r => { const v = val[r.dataset.r]; if (v && document.activeElement !== r) r.value = v[0]; });
    bas.querySelectorAll('[data-v]').forEach(b => { const v = val[b.dataset.v]; if (v) b.textContent = v[1]; });
  }

  /* ---------- Changements d'état ---------- */
  function changerScene(sc) {
    arreter();
    S.scene = sc;
    rendreBas();
    c.message('');
    rendre();
  }
  // réglages de la scène « force » : arrondis et bornes ; le chariot revient en A
  function regler(n) {
    // les commandes sous la figure ne sont reconstruites que si la scène ou l'objet change
    // (jamais pendant qu'on fait glisser un curseur)
    const refaire = (n.scene && n.scene !== S.scene) || (n.objet && n.objet !== S.objet) || n.ch && n.ch.chemin || n.po && n.po.trajet;
    if (n.scene) S.scene = n.scene;
    if (n.objet) S.objet = n.objet;
    if (n.F != null) S.F = borne(Math.round(n.F), 0, 20);
    if (n.AB != null) S.AB = borne(Math.round(n.AB * 10) / 10, 0, 2);
    if (n.alpha != null) S.alpha = TF.normal(Math.round(n.alpha));
    if (n.ch) {
      const ancien = cleForceCh();
      Object.assign(S.ch, n.ch);
      S.ch.F = borne(Math.round(S.ch.F), 0, 20);
      S.ch.alpha = TF.normal(Math.round(S.ch.alpha));
      S.ch.phi = S.ch.alpha;
      if (cleForceCh() !== ancien) S.ch.faits = {};             // nouvelle force : les chemins sont à refaire
    }
    if (n.po) {
      Object.assign(S.po, n.po);
      S.po.m = borne(Math.round(S.po.m), 1, 120);
      S.po.zA = borne(Math.round(S.po.zA / 5) * 5, 0, 150);
      S.po.zB = borne(Math.round(S.po.zB / 5) * 5, 0, 150);
      if (n.po.zA != null || n.po.zB != null || n.po.trajet) { if (S.po.trajet === 'libre' && (n.po.zA != null || n.po.zB != null)) { S.po.libre = null; S.po.trace = null; } }
    }
    arreter(true);
    if (n.masque != null) S.masque = n.masque;
    mesurer();
    if (refaire) rendreBas(); else majCurseurs();
    c.message('');
    rendre(true);
  }
  TF.regler = regler;

  /* ---------- Mesures relevées toutes seules (onglet Graphiques) ---------- */
  function mesurer() {
    if (S.scene !== 'force') return;
    const w = Wforce();
    const def = { F: [`${S.AB}|${S.alpha}`, S.F], AB: [`${S.F}|${S.alpha}`, S.AB], alpha: [`${S.F}|${S.AB}`, S.alpha] };
    Object.keys(def).forEach(k => {
      const [cle, x] = def[k], s = S.series[k];
      if (s.cle !== cle) { s.cle = cle; s.pts = []; }
      const i = s.pts.findIndex(p => p[0] === x);
      if (i >= 0) s.pts[i] = [x, w]; else s.pts.push([x, w]);
      s.pts.sort((a, b) => a[0] - b[0]);
    });
  }

  /* ---------- Animation ---------- */
  const A = { joue: false, u: 0, raf: 0, t: 0 };
  function longueur() {
    if (S.scene === 'force') return S.AB;
    const pts = S.scene === 'chemins' ? TF.cheminPts(S) : TF.trajetPts(S);
    if (!pts) return 0;
    return TF.portions(pts).reduce((s, p) => s + p.l, 0);
  }
  // position le long du déplacement pour la fraction u du temps (chariot : accélère ou ralentit selon W)
  function placer() {
    const L = longueur();
    if (S.scene === 'force') {
      const max = S.F * S.AB, k = max ? 0.45 * Wforce() / max : 0;
      S.pos = S.AB * ((1 - k) * A.u + k * A.u * A.u);
    } else if (S.scene === 'chemins') S.ch.avance = L * A.u;
    else S.po.avance = L * A.u;
  }
  function arreter(remettre) {
    if (A.raf) cancelAnimationFrame(A.raf);
    A.raf = 0; A.joue = false; S.ch.anim = false;
    if (remettre) { A.u = 0; S.pos = 0; S.ch.avance = 0; S.po.avance = 0; }
    majBoutonLire();
  }
  function majBoutonLire() {
    const b = bas.querySelector('[data-act="lire"]');
    if (!b || reduit) return;
    const nom = S.scene === 'chemins' ? 'Parcourir' : 'Lancer';
    b.textContent = A.joue ? '❚❚ Pause' : A.u > 0 && A.u < 1 ? '▶ Reprendre' : '▶ ' + nom;
  }
  // vérifie qu'un déplacement est possible
  function possible() {
    if (S.scene === 'force' && S.AB <= 0) { c.message('Écarte B de A pour que l\'objet se déplace.', 'refus'); return false; }
    if (S.scene === 'chemins' && !TF.cheminPts(S)) { c.message('Trace d\'abord ton chemin de A à B.', 'refus'); return false; }
    if (S.scene === 'poids' && !TF.trajetPts(S)) { c.message('Trace d\'abord le trajet de A à B.', 'refus'); return false; }
    return true;
  }
  function lire() {
    if (reduit) { pas(); return; }
    if (A.joue) { arreter(); return; }
    if (!possible()) return;
    if (A.u >= 1) A.u = 0;
    A.joue = true; S.ch.anim = true; A.t = performance.now();
    c.message('');
    majBoutonLire();
    const duree = S.scene === 'force' ? 1.4 + S.AB : S.scene === 'chemins' ? 4 : 5;
    const boucle = now => {
      const dt = Math.min(0.1, (now - A.t) / 1000); A.t = now;
      A.u = Math.min(1, A.u + dt * S.vit / duree);
      placer(); dessiner();
      if (A.u >= 1) { A.raf = 0; A.joue = false; S.ch.anim = false; finir(); return; }
      A.raf = requestAnimationFrame(boucle);
    };
    A.raf = requestAnimationFrame(boucle);
  }
  // pas à pas : un cinquième du trajet (chariot), une portion (chemins), un huitième (poids)
  function pas() {
    if (A.joue) arreter();
    if (!possible()) return;
    if (A.u >= 1) A.u = 0;
    if (S.scene === 'chemins') {
      const pts = TF.cheminPts(S), por = TF.portions(pts), L = longueur();
      let cum = 0, cible = L;
      const n = por.length > 8 ? 8 : por.length;
      if (por.length > 8) cible = Math.min(L, (Math.floor(A.u * n + 1e-9) + 1) * L / n);
      else for (const p of por) { cum += p.l; if (cum / L > A.u + 1e-9) { cible = cum; break; } }
      A.u = Math.min(1, cible / L);
    } else A.u = Math.min(1, Math.round((A.u + (S.scene === 'force' ? 0.2 : 0.125)) * 1000) / 1000);
    placer(); dessiner();
    if (A.u >= 1) finir(); else majBoutonLire();
  }
  // fin du déplacement : ce que la force a fait, mémorisé pour les défis
  function finir() {
    majBoutonLire();
    if (S.scene === 'force') {
      const w = Wforce();
      S.dernier = { objet: S.objet, F: S.F, AB: S.AB, alpha: S.alpha, W: w };
      const qui = S.objet === 'wagon' ? 'Le wagon' : 'Le chariot';
      c.message(w > 1e-9 ? `${qui} a accéléré : la force lui a <b>fourni</b> ${S.masque ? 'de l\'énergie' : joules(w)} (travail moteur).`
        : w < -1e-9 ? `${qui} a ralenti : la force lui a <b>retiré</b> ${S.masque ? 'de l\'énergie' : joules(-w)} (travail résistant).`
        : `${qui} garde la même vitesse : la force ne lui a ni fourni ni retiré d'énergie (travail nul).`, 'info');
    } else if (S.scene === 'chemins') {
      const tot = Wcumule(1);
      S.ch.faits[S.ch.chemin] = { W: tot };
      c.message(`Chemin « ${nomChemin()} » terminé : W = ${joules(tot)}, comme F × AB × cos α = ${joules(Wch())}.`, 'info');
    } else {
      const w = Wpoids(), t = TF.TRAJETS.find(x => x.id === S.po.trajet).nom;
      S.po.dernier = { trajet: S.po.trajet, m: S.po.m, zA: S.po.zA, zB: S.po.zB, W: w };
      S.po.faits.unshift(S.po.dernier);
      S.po.faits = S.po.faits.slice(0, 4);
      c.message(`${t} : W(${vec('P')}) = m g (z<sub>A</sub> − z<sub>B</sub>) = ${joules(w)} (${nature(w) === 'nul' ? 'travail nul' : 'travail ' + nature(w)}).`, 'info');
    }
    rendre(true);
  }
  const nomChemin = () => TF.CHEMINS.find(x => x.id === S.ch.chemin).nom.toLowerCase();

  // travail accumulé pour la fraction u du trajet
  function Wcumule(u) {
    if (S.scene === 'force' || u == null) return 0;
    if (S.scene === 'chemins') {
      const pts = TF.cheminPts(S);
      if (!pts) return 0;
      const L = longueur(), p = TF.surChemin(pts, L * u);
      // F⃗ · (position − A) : la force est constante
      return S.ch.F * (cosd(S.ch.phi) * p.x + Math.sin(TF.rad(S.ch.phi)) * p.y);
    }
    const pts = TF.trajetPts(S);
    if (!pts) return 0;
    const p = TF.surChemin(pts, longueur() * u);
    return S.po.m * G * (S.po.zA - p.y);
  }

  /* ---------- Dessin de la figure, lecture, jauge ---------- */
  let taille = [0, 0], geo = null;
  function dessiner() {
    const W = Math.round(c.fig.clientWidth), H = Math.round(c.fig.clientHeight);
    if (!W || !H) return;
    taille = [W, H];
    const r = S.scene === 'force' ? TF.dessinForce(S, W, H) : S.scene === 'chemins' ? TF.dessinChemins(S, W, H) : TF.dessinPoids(S, W, H);
    c.fig.innerHTML = r.svg;
    geo = r.geo;
    c.fig.classList.toggle('tf-dessin', (S.scene === 'chemins' && S.ch.chemin === 'libre') || (S.scene === 'poids' && S.po.trajet === 'libre'));
    lecture();
  }
  function lecture() {
    const L = $('lecture');
    let w, max, partiel, txt;
    if (S.scene === 'force') {
      w = Wforce(); max = S.F * S.AB; partiel = S.AB ? w * S.pos / S.AB : 0;
      txt = `${W_('F')} = F × AB × cos α = ${S.F} × ${fmt(S.AB, 1)} × cos ${deg(S.alpha)} =${S.masque ? NB + '<b>?</b>' : ` <b>${joules(w)}</b>`}${S.masque ? '' : ` · travail ${nature(w)}`}`;
    } else if (S.scene === 'chemins') {
      w = Wch(); partiel = Wcumule(A.u);
      const pts = TF.cheminPts(S);
      max = Math.max(Math.abs(w), ...(pts ? Array.from({ length: 41 }, (_, i) => Math.abs(Wcumule(i / 40))) : [0]), 1e-9);
      txt = `Chemin ${nomChemin()} · W accumulé = <b>${joules(partiel)}</b> · F × AB × cos α = ${S.ch.F} × ${fmt(ABch(), 1)} × cos ${deg(S.ch.alpha)} = ${joules(w)}`;
    } else {
      w = Wpoids(); partiel = Wcumule(A.u);
      max = Math.max(Math.abs(w), ...Array.from({ length: 41 }, (_, i) => Math.abs(Wcumule(i / 40))), 1e-9);
      txt = `${W_('P')} = m g (z<sub>A</sub> − z<sub>B</sub>) = ${S.po.m} × ${fmt(G, 2)} × (${S.po.zA} − ${S.po.zB}) = <b>${joules(w)}</b> · travail ${nature(w)}`;
    }
    L.innerHTML = txt;
    // jauge : énergie transmise depuis le départ (positive, nulle ou négative)
    const cache = S.masque && S.scene === 'force';
    const p = max ? Math.min(1, Math.abs(partiel) / max) * 50 : 0, r = $('rempli');
    r.style.width = (cache ? 0 : p) + '%';
    r.style.left = partiel < 0 ? (50 - p) + '%' : '50%';
    const v = $('jv');
    const enCours = S.scene === 'force' ? S.pos > 0 : (S.scene === 'chemins' ? S.ch.avance : S.po.avance) > 0;
    v.innerHTML = cache ? '?' : !enCours ? 'Lance le déplacement' : `${partiel > 1e-9 ? '+' : ''}${joules(partiel)} · ${partiel > 1e-9 ? 'moteur' : partiel < -1e-9 ? 'résistant' : 'nul'}`;
    $('jauge').setAttribute('aria-label', cache ? 'Jauge masquée : travail à trouver' : `Énergie transmise depuis le départ : ${joules(partiel).replace(/<[^>]+>/g, '')}`);
  }

  /* ---------- Panneau : mises à jour ---------- */
  function majFormule() {
    const s = c.zone.querySelector('[data-s="formule"]'), w = Wforce(), q = sel => s.querySelector(`[data-f="${sel}"]`);
    q('F').textContent = S.F + ' N';
    q('AB').textContent = fmt(S.AB, 1) + ' m';
    q('alpha').textContent = deg(S.alpha);
    q('cos').textContent = fmt(cosd(S.alpha), 3);
    q('W').innerHTML = S.masque ? '?' : joules(w);
    q('formule').innerHTML = `${W_('F')} = ${S.F} × ${fmt(S.AB, 1)} × cos ${deg(S.alpha)} =${S.masque ? NB + '?' : ' ' + joules(w)}`;
    q('nature').innerHTML = S.masque ? 'Calcule W, puis vérifie : moteur, nul ou résistant ?' : `Travail <b>${nature(w)}</b> : ${natureTxt(S.alpha)}`;
    s.querySelectorAll('[data-masque]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.masque === '1') === S.masque)));
    const cas = Math.abs(S.alpha) === 90 ? 90 : S.alpha === 0 ? 0 : Math.abs(S.alpha) === 180 ? 180 : null;
    s.querySelectorAll('[data-cas]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.cas === cas)));
    q('cas').innerHTML = cas == null || S.masque ? '' : `<div class="cle tf-cle">${CAS[cas]}</div>`;
    // « W à trouver » : une question dont la réponse suit les réglages
    const zt = q('trouver'), cle = `${S.F}|${S.AB}|${S.alpha}|${S.masque}`;
    if (zt.dataset.cle !== cle) {
      zt.dataset.cle = cle;
      zt.innerHTML = '';
      if (S.masque) {
        TF.question(zt, {
          type: 'nombre', enonce: `<p>Calcule le travail de ${vec('F')} pour ces réglages (3 chiffres significatifs).</p>`, label: 'W =', unite: 'J', calc: true,
          valeur: w, tol: Math.max(0.01, Math.abs(w) * 0.005),
          diag: v => diagW(v, S.F, S.AB, S.alpha),
          solution: `${W_('F')} = ${S.F} × ${fmt(S.AB, 1)} × cos ${deg(S.alpha)} ≈ ${joules(w)} : travail ${nature(w)}.`,
          surReussite: () => { S.trouve = cle; },
        });
      }
    }
  }
  const natureTxt = a => (Math.abs(a) < 90 ? 'α < 90°, cos α > 0.' : Math.abs(a) === 90 ? `α = 90°, ${vec('F')} est perpendiculaire au déplacement.` : 'α > 90°, cos α < 0.');
  const CAS = {
    0: `<p><b>α = 0°</b> : ${vec('F')} tire dans le sens du déplacement, cos 0° = 1 : W = F × AB, le plus grand travail possible.</p>`,
    90: `<p><b>α = 90°</b> : ${vec('F')} est perpendiculaire au déplacement, cos 90° = 0 : W = 0, la force ne travaille pas.</p>`,
    180: `<p><b>α = 180°</b> : ${vec('F')} est opposée au déplacement, cos 180° = −1 : W = −F × AB, le travail le plus résistant.</p>`,
  };
  // diagnostics d'un calcul de W = F × AB × cos α
  function diagW(v, F, AB, a) {
    const w = F * AB * cosd(a), proche = (x, y) => Math.abs(x - y) <= Math.max(0.02, Math.abs(y) * 0.01);
    if (a !== 0 && proche(v, F * AB)) return 'Tu as oublié cos α : W = F × AB × cos α, pas F × AB.';
    if (!proche(w, F * AB * Math.cos(a)) && proche(v, F * AB * Math.cos(a))) return `${fmt(Math.cos(a), 2)} au lieu de ${fmt(cosd(a), 2)} pour cos α : ta calculatrice est en <b>radians</b>, passe-la en <b>degrés</b>.`;
    if (Math.abs(a) !== 90 && proche(v, F * AB * Math.abs(Math.sin(TF.rad(a))))) return 'Tu as pris l\'angle par rapport à la verticale (ou sin α) : α est l\'angle entre la force et le déplacement, et on prend cos α.';
    if (w !== 0 && proche(v, -w)) return `Le signe : ${Math.abs(a) < 90 ? 'α < 90°, cos α > 0 : le travail est moteur, positif' : 'α > 90°, cos α < 0 : le travail est résistant, négatif'}.`;
    return `Écris W = F × AB × cos α, puis remplace : ${F} × ${fmt(AB, 1)} × cos ${deg(a)}.`;
  }

  function majGraphesTxt() {
    const s = c.zone.querySelector('[data-s="graphes"]');
    s.querySelectorAll('[data-gr]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gr === S.graphe)));
  }
  function graphe() {
    majGraphesTxt();
    const s = c.zone.querySelector('[data-s="graphes"]'), svg = s.querySelector('[data-g="svg"]'), k = S.graphe, se = S.series[k];
    const q = x => s.querySelector(`[data-g="${x}"]`);
    const X = { F: { max: 20, pas: 5, nom: 'F (N)', min: 0 }, AB: { max: 2, pas: 0.5, nom: 'AB (m)', min: 0 }, alpha: { min: -180, max: 180, pas: 90, nom: 'α (°)' } }[k];
    const amp = k === 'F' ? 20 * S.AB * Math.abs(cosd(S.alpha)) : k === 'AB' ? S.F * 2 * Math.abs(cosd(S.alpha)) : S.F * S.AB;
    const pts = se.pts;
    const ymax = Math.max(amp, ...pts.map(p => Math.abs(p[1])), 1);
    const pasY = pasJoli(ymax), Y = Math.ceil(ymax / pasY) * pasY;
    const neg = k === 'alpha' || pts.some(p => p[1] < -1e-9) || cosd(S.alpha) < 0;
    const pos = k === 'alpha' || pts.some(p => p[1] > 1e-9) || cosd(S.alpha) > 0;
    const y0 = neg ? -Y : 0, y1 = pos ? Y : 0.0001;
    const g0 = { l: 44, r: 290, t: 20, b: 146 };
    const px = x => g0.l + (x - X.min) / (X.max - X.min) * (g0.r - g0.l), py = y => g0.b - (y - y0) / ((y1 || 1) - y0) * (g0.b - g0.t);
    let h = '';
    for (let x = X.min; x <= X.max + 1e-9; x += X.pas) h += `<line x1="${px(x)}" y1="${g0.t}" x2="${px(x)}" y2="${g0.b}" class="tf-grille"/><text x="${px(x)}" y="${g0.b + 14}" class="tf-grad" text-anchor="middle">${fmt(x, k === 'AB' ? 1 : 0)}</text>`;
    for (let y = y0; y <= (y1 || 0) + 1e-9; y += pasY) h += `<line x1="${g0.l}" y1="${py(y)}" x2="${g0.r}" y2="${py(y)}" class="tf-grille"/><text x="${g0.l - 5}" y="${py(y) + 4}" class="tf-grad" text-anchor="end">${fmt(y, pasY < 1 ? 1 : 0)}</text>`;
    h += `<line x1="${g0.l}" y1="${py(0)}" x2="${g0.r}" y2="${py(0)}" class="tf-axe"/><line x1="${px(Math.max(0, X.min))}" y1="${g0.t}" x2="${px(Math.max(0, X.min))}" y2="${g0.b}" class="tf-axe"/>`;
    h += `<text x="${g0.r}" y="${g0.b + 26}" class="tf-nom-axe" text-anchor="end">${X.nom}</text><text x="4" y="${g0.t - 2}" class="tf-nom-axe">W (J)</text>`;
    const montrer = q('courbe').checked;
    if (montrer) {
      if (k === 'alpha') {
        let d = '';
        for (let a = -180; a <= 180; a += 3) d += (a === -180 ? 'M' : 'L') + px(a).toFixed(1) + ',' + py(S.F * S.AB * cosd(a)).toFixed(1);
        h += `<path d="${d}" class="tf-courbe-th"/>`;
        if (S.F * S.AB > 0) h += `<text x="${px(0)}" y="${py(S.F * S.AB) - 4}" class="tf-annot" text-anchor="middle">max à 0°</text><text x="${px(90) + 3}" y="${py(0) - 5}" class="tf-annot">0 à 90°</text><text x="${px(180) - 6}" y="${py(-S.F * S.AB) - 6}" class="tf-annot" text-anchor="end">min à 180°</text>`;
      } else {
        const pente = k === 'F' ? S.AB * cosd(S.alpha) : S.F * cosd(S.alpha);
        h += `<line x1="${px(0)}" y1="${py(0)}" x2="${px(X.max)}" y2="${py(pente * X.max)}" class="tf-courbe-th"/>`;
      }
    }
    pts.forEach(p => { h += `<circle cx="${px(p[0]).toFixed(1)}" cy="${py(p[1]).toFixed(1)}" r="${pts.length > 60 ? 2.2 : 3.6}" class="tf-pt"/>`; });
    svg.innerHTML = h;
    svg.setAttribute('aria-label', `Graphique W en fonction de ${k === 'alpha' ? 'α' : k} : ${pts.length} mesure${pts.length > 1 ? 's' : ''}`);
    q('courbeNom').innerHTML = k === 'alpha' ? 'Superposer F × AB × cos α' : 'Droite passant par l\'origine';
    q('consigne').innerHTML = k === 'F' ? `Série AB = ${fmt(S.AB, 1)} m, α = ${deg(S.alpha)} : fais varier <b>F</b>.`
      : k === 'AB' ? `Série F = ${S.F} N, α = ${deg(S.alpha)} : fais varier <b>AB</b> (curseur ou point B).`
      : `Série F = ${S.F} N, AB = ${fmt(S.AB, 1)} m : <b>tourne la force</b> (pointe de ${vec('F')} ou boutons ±).`;
    const n = pts.length;
    q('conclu').innerHTML = k === 'alpha'
      ? (n >= 7 ? 'W est maximal pour 0°, nul pour 90°, négatif et minimal pour 180° : comme cos α. ' + (montrer ? 'Les points sont sur la courbe F × AB × cos α.' : 'Superpose la courbe F × AB × cos α.') : `${n} mesure${n > 1 ? 's' : ''} : tourne la force de 0° à 180°.`)
      : (n >= 3 && pts.some(p => p[0] > 0) ? (cosd(S.alpha) === 0 ? 'Avec α = 90°, W reste nul.' : `Les points sont alignés sur une droite qui passe par l'origine : <b>W est proportionnel à ${k === 'F' ? 'F' : 'AB'}</b>.`) : `${n} mesure${n > 1 ? 's' : ''} (relevées toutes seules) : il en faut au moins 3.`);
    const nomX = k === 'F' ? 'F (N)' : k === 'AB' ? 'AB (m)' : 'α (°)';
    const nl = c.tel() ? 3 : innerHeight < 700 ? 4 : 6;        // lignes du tableau (moins sur un petit écran)
    const montres = k === 'alpha' && n > nl ? pts.filter((p, i) => i % Math.ceil(n / nl) === 0 || i === n - 1).slice(-nl) : pts.slice(-nl);
    q('tab').innerHTML = `<thead><tr><th>${nomX}</th><th>W (J)</th></tr></thead><tbody>${montres.map(p => `<tr><td>${k === 'alpha' ? deg(p[0]).replace('°', '') : fmt(p[0], k === 'AB' ? 1 : 0)}</td><td>${S.masque ? '?' : fmt(p[1], 2)}</td></tr>`).join('') || '<tr><td colspan="2">aucune mesure</td></tr>'}</tbody>`;
  }
  const pasJoli = m => { const p = Math.pow(10, Math.floor(Math.log10(m / 2))), r = m / 2 / p; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p; };

  function majChemins() {
    const s = c.zone.querySelector('[data-s="chemins"]'), q = x => s.querySelector(`[data-c="${x}"]`);
    q('total').innerHTML = `${W_('F')} = F × AB × cos α = ${S.ch.F} × ${fmt(ABch(), 1)} × cos ${deg(S.ch.alpha)} = ${joules(Wch())}`;
    const pts = TF.cheminPts(S);
    if (!pts) { q('portions').innerHTML = '<tbody><tr><td>Trace ton chemin de A à B sur la figure.</td></tr></tbody>'; q('somme').innerHTML = ''; }
    else {
      const por = TF.portions(pts), L = longueur(), fait = S.ch.avance;
      let cum = 0, somme = 0;
      const lignes = por.map((p, i) => {
        const a = Math.round(Math.abs(TF.normal(S.ch.phi - p.ang)) * 10) / 10, wi = S.ch.F * p.l * Math.cos(TF.rad(S.ch.phi - p.ang));
        const atteint = fait >= cum + p.l - 1e-9;
        cum += p.l;
        if (atteint) somme += wi;
        return { i, l: p.l, a, wi, atteint };
      });
      const montrer = lignes.length > 8 ? lignes.filter(x => x.atteint).slice(-4) : lignes;
      q('portions').innerHTML = `<thead><tr><th>Portion</th><th>ℓ (m)</th><th>α<sub>i</sub></th><th>W<sub>i</sub> (J)</th></tr></thead><tbody>${montrer.map(x => `<tr${x.atteint ? '' : ' class="tf-attente"'}><td>${x.i + 1}</td><td>${fmt(x.l, 2)}</td><td>${fmt(x.a, Number.isInteger(x.a) ? 0 : 1)}°</td><td>${x.atteint ? fmt(x.wi, 2) : '…'}</td></tr>`).join('')}
        ${lignes.length > 8 ? `<tr><td colspan="4">${lignes.length} petites portions (${lignes.filter(x => x.atteint).length} parcourues)</td></tr>` : ''}</tbody>`;
      q('somme').innerHTML = `Somme des travaux des portions : ΣW<sub>i</sub> = <b>${fait > 0 ? fmt(Math.abs(fait - L) < 1e-9 ? Wch() : somme, 2) + NB + 'J' : '…'}</b>`;
    }
    const faits = S.ch.faits, noms = TF.CHEMINS.filter(x => faits[x.id]);
    q('faits').innerHTML = noms.length ? `<thead><tr><th>Chemin</th><th>W (J)</th></tr></thead><tbody>${noms.map(x => `<tr><td>${x.nom}</td><td>${fmt(faits[x.id].W, 2)}</td></tr>`).join('')}</tbody>`
      : '<tbody><tr><td>Parcours les chemins avec la même force : leurs travaux s\'inscrivent ici.</td></tr></tbody>';
    q('conclu').innerHTML = noms.length >= 2 ? '<b>Même travail par tous les chemins</b> : pour une force constante, W ne dépend que de A et B, pas du chemin suivi.' : '';
  }
  function majPoids() {
    const s = c.zone.querySelector('[data-s="poids"]'), q = x => s.querySelector(`[data-p="${x}"]`), po = S.po, w = Wpoids(), h = po.zA - po.zB;
    q('formule').innerHTML = `${W_('P')} = m × g × (z<sub>A</sub> − z<sub>B</sub>)<br>= ${po.m} × ${fmt(G, 2)} × (${po.zA} − ${po.zB}) = ${joules(w)}`;
    q('nature').innerHTML = h > 0 ? `Descente de h = ${h} m : travail <b>moteur</b>.` : h < 0 ? `Montée de ${-h} m : z<sub>A</sub> − z<sub>B</sub> = ${-h < 0 ? '' : TF.MOINS}${-h} m, travail <b>résistant</b>.` : 'z<sub>A</sub> = z<sub>B</sub> : travail <b>nul</b>, quel que soit le trajet.';
    q('decompose').checked = po.decompose;
    const pts = TF.trajetPts(S);
    let desc = 0, mont = 0;
    if (pts) TF.portions(pts).forEach(p => { if (p.dy < 0) desc -= p.dy; else mont += p.dy; });
    q('decomp').innerHTML = po.decompose && pts ? `<p>Horizontalement : ${vec('P')} ⊥ déplacement, <b>W = 0</b>.</p>
        <p>Verticalement : descentes ${fmt(desc, 0)} m, montées ${fmt(mont, 0)} m.</p>
        <p>W = m g × (${fmt(desc, 0)} − ${fmt(mont, 0)}) = ${po.m} × ${fmt(G, 2)} × ${fmt(desc - mont, 0)} = ${joules(po.m * G * (desc - mont))}</p>` : '';
    q('faits').innerHTML = po.faits.length ? `<thead><tr><th>Trajet</th><th>z<sub>A</sub> → z<sub>B</sub></th><th>W (J)</th></tr></thead><tbody>${po.faits.map(f => `<tr><td>${TF.TRAJETS.find(x => x.id === f.trajet).nom}</td><td>${f.zA} → ${f.zB} m</td><td>${joules(f.W).replace(NB + 'J', '')}</td></tr>`).join('')}</tbody>`
      : '<tbody><tr><td>Lance l\'objet : ses trajets s\'inscrivent ici.</td></tr></tbody>';
  }

  /* ---------- Rendu général ---------- */
  function rendre(tout) {
    dessiner();
    majCurseurs();
    majFormule();
    if (c.courant() === 'graphes') graphe();
    majChemins();
    majPoids();
    if (defisApi) defisApi.verifier(S);
  }

  /* ---------- Événements : commandes sous la figure ---------- */
  bas.addEventListener('input', e => {
    const r = e.target.closest('[data-r]');
    if (!r) return;
    const v = +r.value, k = r.dataset.r;
    if (k === 'F' || k === 'AB' || k === 'alpha') regler({ [k]: v });
    else if (k === 'chF') regler({ ch: { F: v } });
    else regler({ po: { [k]: v } });
  });
  bas.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.objet) regler({ objet: b.dataset.objet });
    else if (b.dataset.tour) {
      const d = +b.dataset.tour;
      if (S.scene === 'force') regler({ alpha: S.alpha + d, F: S.F || 10 });
      else regler({ ch: { alpha: S.ch.alpha + d } });
    } else if (b.dataset.chemin) { S.ch.chemin = b.dataset.chemin; S.ch.trace = null; arreter(true); rendreBas(); c.message(''); rendre(); }
    else if (b.dataset.trajet) { S.po.trajet = b.dataset.trajet; S.po.trace = null; arreter(true); rendreBas(); c.message(''); rendre(); }
    else if (b.dataset.act === 'lire') lire();
    else if (b.dataset.act === 'pas') pas();
    else if (b.dataset.act === 're') { arreter(true); c.message(''); rendre(); }
    else if (b.dataset.act === 'vit') { S.vit = S.vit === 1 ? 2 : S.vit === 2 ? 0.5 : 1; b.textContent = '× ' + fmt(S.vit, S.vit < 1 ? 1 : 0); b.setAttribute('aria-label', `Vitesse de l'animation : × ${fmt(S.vit, S.vit < 1 ? 1 : 0)}`); }
  });

  /* ---------- Événements : panneau ---------- */
  c.zone.querySelector('.tf-panneau').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.masque) regler({ masque: b.dataset.masque === '1' });
    else if (b.dataset.cas) regler({ alpha: +b.dataset.cas, F: S.F || 10 });
    else if (b.dataset.gr) { S.graphe = b.dataset.gr; graphe(); }
    else if (b.dataset.bil) {
      c.zone.querySelectorAll('[data-bil]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      c.zone.querySelectorAll('[data-bilan]').forEach(x => { x.hidden = x.dataset.bilan !== b.dataset.bil; });
    }
    else if (b.dataset.g === 'effacer') { S.series[S.graphe] = { cle: '', pts: [] }; mesurer(); graphe(); }
    else if (b.dataset.vue) {
      c.zone.querySelectorAll('[data-vue]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('vDefis').hidden = b.dataset.vue !== 'defis';
      $('vQuestions').hidden = b.dataset.vue !== 'questions';
    }
  });
  c.zone.querySelector('.tf-panneau').addEventListener('change', e => {
    if (e.target.matches('[data-g="courbe"]')) { S.courbe = e.target.checked; graphe(); if (defisApi) defisApi.verifier(S); }
    if (e.target.matches('[data-p="decompose"]')) { S.po.decompose = e.target.checked; rendre(); }
  });

  /* ---------- Événements : figure (glisser la force, B, A ; personnages ; tracé libre) ---------- */
  let prise = null;
  const point = e => { const r = c.fig.querySelector('svg').getBoundingClientRect(); return [(e.clientX - r.left) * taille[0] / r.width, (e.clientY - r.top) * taille[1] / r.height]; };
  // angle « aimanté » : attiré par les angles remarquables à moins de 3°
  const REMARQUABLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, -30, -45, -60, -90, -120, -135, -150, -180];
  const aimanter = a => { const m = REMARQUABLES.find(x => Math.abs(a - x) <= 3); return m != null ? m : Math.round(a); };
  c.fig.addEventListener('pointerdown', e => {
    if (!geo || A.joue) return;
    const cible = e.target.closest && e.target.closest('[data-p]');
    const [px, py] = point(e);
    if (cible && cible.dataset.p === 'perso') {
      const p = TF.PERSOS.find(x => x.n === +cible.dataset.n);
      regler({ alpha: p.a, F: S.F || 10 });
      c.message(`Personnage ${p.n} : ${p.dit}`, 'info');
      return;
    }
    // en scène « poids », la poignée B règle z_B (Bp) ; en scène « force », B règle la distance AB
    if (cible) { e.preventDefault(); prise = S.scene === 'poids' && cible.dataset.p === 'B' ? 'Bp' : cible.dataset.p; c.fig.setPointerCapture(e.pointerId); c.fig.classList.add('glisse'); return; }
    // tracé libre : on part de A
    const libreCh = S.scene === 'chemins' && S.ch.chemin === 'libre', librePo = S.scene === 'poids' && S.po.trajet === 'libre';
    if (libreCh || librePo) {
      const a = libreCh ? [0, 0] : [TF.XA, S.po.zA];
      const dPx = libreCh ? Math.hypot(px - geo.X(0), py - geo.Y(0)) : Math.hypot(px - geo.X(TF.XA), py - geo.Z(S.po.zA));
      if (dPx > 34) { c.message('Pose le doigt (ou la souris) sur le point A pour commencer le tracé.', 'refus'); return; }
      e.preventDefault();
      arreter(true);
      prise = 'trace';
      const o = libreCh ? S.ch : S.po;
      o.libre = null; o.trace = [a];
      c.fig.setPointerCapture(e.pointerId);
      c.message('');
      dessiner();
    }
  });
  c.fig.addEventListener('pointermove', e => {
    if (!prise || !geo) return;
    const [px, py] = point(e);
    if (prise === 'fleche') {
      const brut = Math.atan2((S.scene === 'force' ? geo.oy : geo.mobile[1]) - py, px - (S.scene === 'force' ? geo.ox : geo.mobile[0])) * 180 / Math.PI;
      const a = aimanter(brut);
      if (S.scene === 'force') { if (a !== S.alpha) regler({ alpha: a }); }
      else if (a !== S.ch.alpha) regler({ ch: { alpha: a } });
    } else if (prise === 'B' && S.scene === 'force') {
      const AB = borne(Math.round((px - geo.xA) / geo.ppm * 10) / 10, 0, 2);
      if (AB !== S.AB) regler({ AB });
    } else if (prise === 'trace') {
      const libreCh = S.scene === 'chemins';
      const o = libreCh ? S.ch : S.po, d = o.trace[o.trace.length - 1];
      let q;
      if (libreCh) { const [x0, x1, y0, y1] = geo.bornes; q = [borne(geo.Xi(px), x0, x1), borne(geo.Yi(py), y0, y1)]; }
      else q = [borne(geo.Xi(px), 0, 200), borne(geo.Zi(py), 0, TF.ZMAX)];
      const dpx = libreCh ? Math.hypot(geo.X(q[0]) - geo.X(d[0]), geo.Y(q[1]) - geo.Y(d[1])) : Math.hypot(geo.X(q[0]) - geo.X(d[0]), geo.Z(q[1]) - geo.Z(d[1]));
      if (dpx >= 8) { o.trace.push(q); dessiner(); }
    }
    if (S.scene === 'poids' && (prise === 'A' || prise === 'Bp')) {
      const z = borne(Math.round(geo.Zi(py) / 5) * 5, 0, 150);
      if (prise === 'A' && z !== S.po.zA) regler({ po: { zA: z } });
      if (prise === 'Bp' && z !== S.po.zB) regler({ po: { zB: z } });
    }
  });
  const lacher = () => {
    if (prise === 'trace') {
      const libreCh = S.scene === 'chemins', o = libreCh ? S.ch : S.po, d = o.trace[o.trace.length - 1];
      const b = libreCh ? TF.B_CH : [TF.XB, S.po.zB];
      const dPx = libreCh ? Math.hypot(geo.X(d[0]) - geo.X(b[0]), geo.Y(d[1]) - geo.Y(b[1])) : Math.hypot(geo.X(d[0]) - geo.X(b[0]), geo.Z(d[1]) - geo.Z(b[1]));
      if (dPx <= 34 && o.trace.length >= 3) {
        o.trace[o.trace.length - 1] = b.slice();
        o.libre = o.trace; o.trace = null;
        c.message('Ton tracé est prêt : lance le déplacement.', 'info');
      } else c.message('Termine ton tracé sur le point B (recommence en partant de A).', 'refus');
      prise = null;
      rendre();
      return;
    }
    prise = null;
    c.fig.classList.remove('glisse');
  };
  c.fig.addEventListener('pointerup', lacher);
  c.fig.addEventListener('pointercancel', lacher);

  // dessin à la taille disponible
  const suivre = () => {
    const W = Math.round(c.fig.clientWidth), H = Math.round(c.fig.clientHeight);
    if (W && H && (W !== taille[0] || H !== taille[1])) dessiner();
  };
  if (window.ResizeObserver) new ResizeObserver(suivre).observe(c.fig); else addEventListener('resize', suivre);

  /* ============================================================
     DÉFIS « À ESSAYER »
     ============================================================ */
  const ref = { F: null, AB: null };              // situation de départ des défis « doubler W »
  const fixerRef = k => { ref[k] = { F: S.F, AB: S.AB, alpha: S.alpha, W: Wforce() }; };
  const refTxt = k => (ref[k] && Math.abs(ref[k].W) > 1e-9 ? ` Départ : F = ${ref[k].F} N, AB = ${fmt(ref[k].AB, 1)} m, α = ${deg(ref[k].alpha)}, W = ${joules(ref[k].W)}.` : '');
  const forceOk = () => S.scene === 'force' && S.F > 0 && S.AB > 0;
  const DEFIS = [
    { t: `Rends le travail de ${vec('F')} <b>nul</b>, sans mettre F ni AB à zéro.`, ok: () => forceOk() && cosd(S.alpha) === 0,
      preparer: () => regler({ scene: 'force', objet: 'chariot', F: 10, AB: 1.5, alpha: 30 }) },
    { t: 'Pour F = 12 N et AB = 1,5 m, obtiens le <b>plus grand travail</b> possible.', ok: () => forceOk() && S.F === 12 && S.AB === 1.5 && S.alpha === 0,
      preparer: () => regler({ scene: 'force', F: 12, AB: 1.5, alpha: 120 }) },
    { t: 'Obtiens un <b>travail résistant</b>, puis lance l\'objet : il doit ralentir.', ok: () => S.dernier && S.dernier.W < -1e-9,
      preparer: () => regler({ scene: 'force', F: 10, AB: 1, alpha: 60 }) },
    { t: () => `<b>Double W</b> en ne changeant que F.${refTxt('F')}`, debut: () => fixerRef('F'),
      ok: () => forceOk() && ref.F && Math.abs(ref.F.W) > 1e-9 && S.AB === ref.F.AB && S.alpha === ref.F.alpha && S.F === 2 * ref.F.F,
      preparer: () => { regler({ scene: 'force', F: 6, AB: 0.8, alpha: 30 }); fixerRef('F'); } },
    { t: () => `<b>Double W</b> en ne changeant que AB.${refTxt('AB')}`, debut: () => fixerRef('AB'),
      ok: () => forceOk() && ref.AB && Math.abs(ref.AB.W) > 1e-9 && S.F === ref.AB.F && S.alpha === ref.AB.alpha && Math.abs(S.AB - 2 * ref.AB.AB) < 1e-9,
      preparer: () => { regler({ scene: 'force', F: 10, AB: 0.6, alpha: 45 }); fixerRef('AB'); } },
    { t: 'Trouve un angle α pour lequel <b>W = F × AB / 2</b>.', ok: () => forceOk() && Math.abs(cosd(S.alpha) - 0.5) < 1e-9,
      preparer: () => regler({ scene: 'force', F: 10, AB: 1, alpha: 0 }) },
    { t: 'Onglet Graphiques : trace <b>W = f(α)</b> (au moins 7 mesures entre 0° et 180°), puis superpose la courbe F × AB × cos α.',
      ok: () => S.courbe && S.series.alpha.pts.filter(p => p[0] >= 0 && p[0] <= 180).length >= 7 && S.series.alpha.pts.some(p => p[0] <= 10) && S.series.alpha.pts.some(p => p[0] >= 170),
      preparer: () => { regler({ scene: 'force', F: 10, AB: 1, alpha: 0 }); S.graphe = 'alpha'; c.onglet('graphes'); } },
    { t: 'Wagon : fais tirer le personnage qui « ne sert à rien », puis lance le wagon.', ok: () => S.dernier && S.dernier.objet === 'wagon' && Math.abs(S.dernier.alpha) === 90 && S.dernier.F > 0,
      preparer: () => regler({ scene: 'force', objet: 'wagon', F: 10, AB: 1, alpha: 0 }) },
    { t: 'Chemins : va de A à B par <b>deux chemins différents</b> avec la même force et compare les travaux.', ok: () => Object.keys(S.ch.faits).length >= 2,
      preparer: () => regler({ scene: 'chemins', ch: { chemin: 'escalier', F: 10, alpha: 30 } }) },
    { t: 'Chemins : <b>trace toi-même</b> un chemin de A à B (au doigt ou à la souris) et parcours-le.', ok: () => !!S.ch.faits.libre,
      preparer: () => regler({ scene: 'chemins', ch: { chemin: 'libre' } }) },
    { t: 'Poids : le skieur (80 kg) <b>descend de 120 m</b>. Règle z<sub>A</sub> et z<sub>B</sub>, puis lance-le.', ok: () => { const d = S.po.dernier; return d && d.m === 80 && d.zA - d.zB === 120; },
      preparer: () => regler({ scene: 'poids', po: { trajet: 'ski', m: 80, zA: 150, zB: 60 } }) },
    { t: 'Poids : vérifie que le poids <b>ne travaille pas</b> sur un trajet qui revient à la même altitude.', ok: () => { const d = S.po.dernier; return d && d.zA === d.zB; },
      preparer: () => regler({ scene: 'poids', po: { trajet: 'escalier', zA: 100, zB: 40 } }) },
    { t: 'Poids : fais <b>monter</b> l\'objet : le travail du poids devient résistant.', ok: () => { const d = S.po.dernier; return d && d.zB > d.zA; },
      preparer: () => regler({ scene: 'poids', po: { trajet: 'toboggan', zA: 120, zB: 20 } }) },
  ];
  defisApi = TF.defis($('vDefis'), DEFIS, {
    bilan: 'Tous les défis sont réussis. Ouvre le Bilan pour retenir l\'essentiel.',
  });
  TF.defisApi = defisApi;

  /* ============================================================
     QUESTIONS (À essayer › Questions)
     ============================================================ */
  const prochain = (v, x, t) => Math.abs(v - x) <= Math.abs(x) * (t || 0.01) + 1e-9;
  const luge = `<svg viewBox="0 0 220 96" class="tf-q-fig" role="img" aria-label="Luge tirée sur un sol horizontal ; la corde fait 60 degrés avec la verticale">
      <line x1="6" y1="78" x2="214" y2="78" class="tf-sc-sol"/><rect x="40" y="62" width="50" height="12" rx="3" class="tf-sc-sys"/>
      <line x1="90" y1="66" x2="${(90 + 70 * Math.cos(Math.PI / 6)).toFixed(1)}" y2="${(66 - 70 * Math.sin(Math.PI / 6)).toFixed(1)}" stroke="#b35c00" stroke-width="3"/>
      <line x1="90" y1="66" x2="90" y2="8" class="tf-sc-ref"/><path d="M90,40 A26,26 0 0 1 ${(90 + 26 * Math.cos(Math.PI / 6)).toFixed(1)},${(66 - 26 * Math.sin(Math.PI / 6)).toFixed(1)}" class="tf-sc-arc"/>
      <text x="100" y="32" class="tf-sc-alpha">60°</text>${TF.fleche(150, 88, 0, 50, '#55585f', 2).svg}<text x="150" y="70" class="tf-sc-txt">déplacement</text></svg>`;
  const QUESTIONS = [
    { type: 'choix', enonce: '<p>Quelle est l\'unité du travail d\'une force ?</p>',
      options: [['J', 'le joule (J)'], ['N', 'le newton (N)'], ['W', 'le watt (W)'], ['Nm', 'le newton par mètre']], bonne: 'J',
      indices: { N: 'Le newton est l\'unité des <b>forces</b>. Le travail est une <b>énergie</b>.', W: 'Le watt est l\'unité des <b>puissances</b> (le travail se note W, mais ce n\'est pas son unité).', Nm: 'W = F × AB : on <b>multiplie</b> des newtons par des mètres, ce qui donne des joules.' },
      solution: 'Le travail est une énergie : il s\'exprime en joules (1 J = 1 N × 1 m).' },
    { type: 'nombre', enonce: `<p>F = 10 N, AB = 1,0 m et α = 40°. Calcule ${W_('F')} (3 chiffres significatifs).</p>`, label: 'W =', unite: 'J', calc: true,
      valeur: 10 * Math.cos(TF.rad(40)), tol: 0.01, affiche: '7,66', diag: v => diagW(v, 10, 1, 40),
      solution: `${W_('F')} = F × AB × cos α = 10 × 1,0 × cos 40° ≈ 7,66 J.`, regler: () => regler({ scene: 'force', F: 10, AB: 1, alpha: 40 }) },
    { type: 'nombre', enonce: '<p>Calcule cos 30° à la calculatrice (2 décimales).</p>', label: 'cos 30° =', unite: '', calc: true, valeur: Math.cos(TF.rad(30)), tol: 0.006, affiche: '0,87',
      diag: v => (Math.abs(v - Math.cos(30)) < 0.01 ? '0,15 au lieu de 0,87 : ta calculatrice est en <b>radians</b>, passe-la en <b>degrés</b>.' : Math.abs(v - 0.5) < 0.01 ? '0,5, c\'est cos 60° (ou sin 30°) : tape bien cos(30).' : 'Vérifie que ta calculatrice est en degrés, puis tape cos(30).'),
      solution: 'cos 30° ≈ 0,87 (calculatrice en degrés).' },
    { type: 'phrase', enonce: '<p>Complète la phrase.</p>',
      morceaux: ['Pour α = 90°, cos α = ', { options: ['0', '1', '−1'], bonne: '0', indices: { 1: 'cos 0° = 1 ; cos 90° = 0.', '−1': 'cos 180° = −1 ; cos 90° = 0.' } },
        ' : la force est ', { options: ['perpendiculaire', 'parallèle', 'opposée'], bonne: 'perpendiculaire', indices: { parallèle: 'Une force parallèle au déplacement fait un angle de 0° (ou 180°).', opposée: 'Une force opposée au déplacement fait un angle de 180°.' } },
        ' au déplacement, et son travail est ', { options: ['nul', 'moteur', 'résistant'], bonne: 'nul', indices: { moteur: 'cos 90° = 0, donc W = F × AB × 0.', résistant: 'cos 90° = 0, donc W = F × AB × 0.' } }, '.'],
      solution: 'cos 90° = 0 : une force perpendiculaire au déplacement ne travaille pas (W = 0).', regler: () => regler({ scene: 'force', alpha: 90, F: S.F || 10 }) },
    { type: 'choix', enonce: `<p>Wagon : les personnages 1 et 2 tirent avec des forces de même valeur. Le personnage 2 tire en biais (α = 40°). Son travail est :</p>`,
      options: [['petit', 'plus petit que celui du personnage 1'], ['grand', 'plus grand'], ['meme', 'le même'], ['nul', 'nul']], bonne: 'petit',
      indices: { grand: 'cos 40° ≈ 0,77 &lt; cos 0° = 1 : seule une partie de sa force fait avancer le wagon.', meme: 'Les forces ont la même valeur, mais pas le même angle : cos 40° ≠ cos 0°.', nul: 'Il tire un peu vers l\'avant : α = 40° &lt; 90°, son travail est moteur.' },
      solution: 'W₂ = F × AB × cos 40° ≈ 0,77 × F × AB : plus petit que W₁ = F × AB.', regler: () => regler({ scene: 'force', objet: 'wagon', alpha: 40, F: S.F || 10 }), reglerNom: 'Voir le wagon' },
    { type: 'nombre', enonce: `${luge}<p>Un enfant tire sa luge sur 15 m, sur un sol horizontal, avec une force de 40 N. La corde fait un angle de <b>60° avec la verticale</b>. Calcule le travail de cette force (3 chiffres significatifs).</p>`,
      label: 'W =', unite: 'J', calc: true, valeur: 40 * 15 * Math.cos(TF.rad(30)), rel: 0.005, affiche: '520',
      diag: v => (prochain(v, 300) ? '60° est l\'angle avec la <b>verticale</b>. α est l\'angle entre la force et le déplacement (horizontal) : α = 90° − 60° = 30°.' : diagW(v, 40, 15, 30)),
      solution: 'α = 90° − 60° = 30° ; W = 40 × 15 × cos 30° ≈ 520 J.' },
    { type: 'nombre', enonce: '<p>Un skieur de masse 80 kg descend une piste : son altitude diminue de 120 m. Calcule le travail de son poids (g = 9,81 N·kg<sup>−1</sup>, 3 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: 80 * G * 120, rel: 0.006, affiche: '9,42 × 10^4',
      diag: v => (prochain(v, -80 * G * 120) ? 'Il <b>descend</b> : z<sub>A</sub> − z<sub>B</sub> = +120 m, le travail du poids est moteur, positif.' : prochain(v, 9600) ? 'Le poids vaut P = m × g : multiplie aussi par g = 9,81 N·kg<sup>−1</sup>.' : prochain(v, 80 * G) ? 'Tu as calculé le poids P = m g ; multiplie par la hauteur h = 120 m.' : 'W = m × g × (z<sub>A</sub> − z<sub>B</sub>) = 80 × 9,81 × 120.'),
      solution: `${W_('P')} = m g (z<sub>A</sub> − z<sub>B</sub>) = 80 × 9,81 × 120 ≈ 9,42 × 10<sup>4</sup> J (moteur).`, regler: () => regler({ scene: 'poids', po: { trajet: 'ski', m: 80, zA: 150, zB: 30 } }) },
    { type: 'nombre', enonce: '<p>Une randonneuse de 60 kg <b>monte</b> de 500 m d\'altitude. Calcule le travail de son poids (g = 9,81 N·kg<sup>−1</sup>, 3 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: -60 * G * 500, rel: 0.006, affiche: '−2,94 × 10^5',
      diag: v => (prochain(v, 60 * G * 500) ? 'Elle <b>monte</b> : z<sub>B</sub> &gt; z<sub>A</sub>, donc z<sub>A</sub> − z<sub>B</sub> = −500 m. Ne compte pas h positivement pour une montée : le travail est résistant, négatif.' : prochain(Math.abs(v), 30000) ? 'Le poids vaut P = m × g : multiplie aussi par g.' : 'W = m × g × (z<sub>A</sub> − z<sub>B</sub>) = 60 × 9,81 × (−500).'),
      solution: `${W_('P')} = 60 × 9,81 × (−500) ≈ −2,94 × 10<sup>5</sup> J (résistant).` },
    { type: 'choix', enonce: '<p>Une valise de 20 kg roule sur 50 m dans un couloir horizontal. Le travail de son poids vaut :</p>',
      options: [['0', '0 J'], ['p', '9,81 × 10<sup>3</sup> J'], ['m', '−9,81 × 10<sup>3</sup> J'], ['1000', '1,0 × 10<sup>3</sup> J']], bonne: '0',
      indices: { p: 'Tu as calculé m × g × 50 : mais 50 m est un déplacement horizontal. Le poids est vertical, perpendiculaire au déplacement.', m: 'z<sub>A</sub> = z<sub>B</sub> : il n\'y a ni montée ni descente.', 1000: 'W = m g (z<sub>A</sub> − z<sub>B</sub>), et z<sub>A</sub> = z<sub>B</sub>.' },
      solution: `${vec('P')} est perpendiculaire au déplacement horizontal (z<sub>A</sub> = z<sub>B</sub>) : W = 0.` },
    { type: 'choix', enonce: `<p>Pour aller de A à B, un chemin droit et un chemin long et sinueux. ${vec('F')} est constante. Sur quel chemin son travail est-il le plus grand ?</p>`,
      options: [['meme', 'le même sur les deux'], ['long', 'sur le chemin long'], ['droit', 'sur le chemin droit']], bonne: 'meme',
      indices: { long: 'Le chemin long a des portions où la force travaille positivement et d\'autres négativement : la somme est la même.', droit: 'Essaie dans l\'onglet Chemins : tous les chemins donnent le même travail.' },
      solution: 'Pour une force constante, W = F × AB × cos α ne dépend que de A et B, pas du chemin suivi.', regler: () => regler({ scene: 'chemins', ch: { chemin: 'zigzag' } }), reglerNom: 'Voir les chemins' },
    { type: 'nombre', enonce: '<p>Un remorqueur tire un pétrolier avec une force constante de 100 kN sur 2,0 km ; le câble fait un angle de 20° avec le déplacement. Calcule le travail de la force (2 chiffres significatifs).</p>',
      label: 'W =', unite: 'J', calc: true, valeur: 100e3 * 2000 * Math.cos(TF.rad(20)), rel: 0.03, affiche: '1,9 × 10^8',
      diag: v => (prochain(v, 100e3 * 2 * Math.cos(TF.rad(20)), 0.03) || prochain(v, 100 * 2000 * Math.cos(TF.rad(20)), 0.03) || prochain(v, 100 * 2 * Math.cos(TF.rad(20)), 0.03)
        ? 'Convertis d\'abord : F = 100 kN = 100 × 10<sup>3</sup> N et AB = 2,0 km = 2,0 × 10<sup>3</sup> m.' : diagW(v, 100e3, 2000, 20)),
      solution: 'W = 100 × 10<sup>3</sup> × 2,0 × 10<sup>3</sup> × cos 20° ≈ 1,9 × 10<sup>8</sup> J.' },
    { type: 'phrase', enonce: '<p>Complète la phrase.</p>',
      morceaux: ['Le travail est résistant (W < 0) quand α est compris entre ', { options: ['0°', '90°', '180°'], bonne: '90°', indices: { '0°': 'Entre 0° et 90°, cos α > 0 : le travail est moteur.' } },
        ' et ', { options: ['0°', '90°', '180°'], bonne: '180°' }, ' : cos α est alors ', { options: ['positif', 'nul', 'négatif'], bonne: 'négatif', indices: { positif: 'cos 120° = −0,5 : regarde le graphique W = f(α).', nul: 'cos α n\'est nul que pour 90°.' } }, '.'],
      solution: 'Pour 90° < α ≤ 180°, cos α < 0 : W < 0, travail résistant.' },
    { type: 'choix', enonce: '<p>La Lune tourne autour de la Terre sur un cercle, à vitesse constante. La force d\'attraction de la Terre, dirigée vers le centre du cercle :</p>',
      options: [['nul', 'ne travaille pas'], ['moteur', 'a un travail moteur'], ['res', 'a un travail résistant']], bonne: 'nul',
      indices: { moteur: 'À chaque instant, la force (vers le centre) est perpendiculaire au déplacement (tangent au cercle) : cos 90° = 0.', res: 'À chaque instant, la force (vers le centre) est perpendiculaire au déplacement (tangent au cercle) : cos 90° = 0.' },
      solution: 'La force est perpendiculaire au déplacement à chaque instant : son travail est nul (la vitesse ne change pas).' },
  ];
  // puces Q1…Qn et la question choisie
  (function questions() {
    const z = $('vQuestions');
    z.innerHTML = `<div class="tf-puces" role="tablist" aria-label="Questions">${QUESTIONS.map((q, i) => `<button type="button" role="tab" class="tf-puce" data-q="${i}" aria-selected="${i === 0}" aria-label="Question ${i + 1}">Q${i + 1}</button>`).join('')}</div><div data-a="qZone"></div>`;
    const qz = z.querySelector('[data-a="qZone"]'), puces = Array.from(z.querySelectorAll('[data-q]')), objets = [];
    QUESTIONS.forEach((q, i) => {
      const d = document.createElement('div');
      d.hidden = i !== 0;
      qz.appendChild(d);
      objets.push(TF.question(d, Object.assign({}, q, { surReussite: () => { puces[i].classList.add('fait'); puces[i].setAttribute('aria-label', `Question ${i + 1}, réussie`); } })));
    });
    puces.forEach((p, i) => { p.onclick = () => { puces.forEach((x, k) => x.setAttribute('aria-selected', String(k === i))); Array.from(qz.children).forEach((x, k) => { x.hidden = k !== i; }); p.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }; });
  })();

  /* ---------- Départ ---------- */
  rendreBas();
  mesurer();
  rendre(true);
  setTimeout(dessiner, 0);
})();
