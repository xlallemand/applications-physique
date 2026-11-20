/* ============================================================
   Figure d'une lentille sur quadrillage et tracé des rayons
   (série d'entraînement ; outil OPT de assets/optique.js)

   Les coordonnées sont en CARREAUX : centre optique O en (0, 0), axe optique
   horizontal, la lumière va de gauche à droite ; f : distance focale en carreaux.

   LT.figure(zone, o)               o = { f, xmin, xmax, ymax (le cadre va de −ymax à ymax), pas (unités par carreau),
                                          foyers: true (F et F′ dessinés), aria }
     → F = { S, f, c(p) (carreaux → scène), k(q) (scène → carreaux), bord(P, d) (sortie du cadre),
             rayon(calque, a, b, o), fleche(calque, a, b, cls), point(calque, p, nom, o), toucher(evt) → point en carreaux }
   LT.TYPES                         rayons particuliers : 'parallele', 'centre', 'foyer' (libellés, diagnostics)
   LT.particulier(f, B, type)       rayon particulier issu de B → { I, d (incident), e (émergent) }
   LT.rebours(f, Bi, type)          rayon qui arrive en B′ (construction à rebours) : type 'parallele' (ressort
                                    parallèle à l'axe), 'centre', 'foyer' (ressort en passant par F′) → { I, d, e }
   LT.sensLumiere(F)                flèche « sens de la lumière » en haut à gauche
   LT.tracer(F, cmd, o)             tracé d'un rayon au doigt : on glisse un point par où il passe
                                    (aimanté aux nœuds et demi-nœuds, à F, F′ et O), ou ◀ ▶ ▲ ▼ ;
                                    o = { I, sens: 'aval' (rayon émergent) | 'amont' (rayon incident), juste (direction attendue, de I vers le point),
                                          diag(P) → texte, diagCote(P) → texte ou null (point du mauvais côté),
                                          surJuste(), surErreur(diag), calque, depart }
                                    → { montrer(), quitter() }
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V;

  /* ---------- Les rayons particuliers ---------- */
  const TYPES = {
    parallele: { label: 'parallèle à l\'axe optique', court: 'parallèle à l\'axe',
      diag: 'Un rayon qui arrive parallèle à l\'axe ressort en passant par le foyer <b>image</b> F′, de l\'autre côté de la lentille.',
      regle: 'Tout rayon qui arrive parallèle à l\'axe optique ressort de la lentille en passant par le foyer image F′.' },
    centre: { label: 'passant par le centre optique O', court: 'par O',
      diag: 'Un rayon qui passe par le centre optique O n\'est pas dévié.',
      regle: 'Tout rayon qui passe par le centre optique O de la lentille n\'est pas dévié.' },
    foyer: { label: 'passant par le foyer objet F', court: 'par F',
      diag: 'Un rayon qui passe par le foyer objet F ressort parallèle à l\'axe optique.',
      regle: 'Tout rayon qui arrive en passant par le foyer objet F ressort de la lentille parallèle à l\'axe optique.' },
  };
  // à rebours : le rayon qui arrive en B′ ressort parallèle à l'axe, passe par O, ou ressort en passant par F′
  const TYPES_REBOURS = {
    parallele: { label: 'qui ressort parallèle à l\'axe', court: 'ressort parallèle à l\'axe',
      diag: 'Un rayon qui ressort parallèle à l\'axe optique est arrivé en passant par le foyer objet F.' },
    centre: { label: 'qui passe par le centre optique O', court: 'par O',
      diag: 'Un rayon qui passe par le centre optique O n\'est pas dévié.' },
    foyer: { label: 'qui ressort en passant par F′', court: 'ressort par F′',
      diag: 'Un rayon qui ressort en passant par le foyer image F′ est arrivé parallèle à l\'axe optique.' },
  };
  const DIAG_LENTILLE = 'Le rayon ne change de direction qu\'en traversant la lentille.';

  // rayon particulier issu de B (objet à gauche de la lentille)
  function particulier(f, B, type) {
    let I, d;
    if (type === 'parallele') { I = [0, B[1]]; d = [1, 0]; }
    else if (type === 'centre') { I = [0, 0]; d = V.norm(V.sub(I, B)); }
    else { d = V.norm(V.sub([-f, 0], B)); I = OPT.intersection(B, d, [0, 0], [0, 1]); if (d[0] < 0) d = V.mul(d, -1); }
    return { I, d, e: OPT.emergent([0, 0], f, I, d) };
  }
  // rayon qui arrive en B′ (à droite de la lentille), construit à rebours
  function rebours(f, Bi, type) {
    let I, e;
    if (type === 'parallele') { I = [0, Bi[1]]; e = [1, 0]; }
    else if (type === 'centre') { I = [0, 0]; e = V.norm(Bi); }
    else { e = V.norm(V.sub(Bi, [f, 0])); I = OPT.intersection(Bi, e, [0, 0], [0, 1]); }
    return { I, e, d: OPT.incident([0, 0], f, I, e) };
  }

  /* ---------- La figure ---------- */
  function figure(zone, o) {
    const pas = o.pas || 24, f = o.f;
    const xmin = o.xmin, xmax = o.xmax, ymax = o.ymax;
    const W = (xmax - xmin) * pas, H = 2 * ymax * pas, cx = (xmin + xmax) / 2;
    const S = OPT.scene(zone, { largeur: W, hauteur: H, aria: o.aria || 'Lentille convergente sur un quadrillage' });
    const c = p => [(p[0] - cx) * pas, p[1] * pas];
    const k = q => [q[0] / pas + cx, q[1] / pas];
    S.quadrillage({ pas, origine: c([0, 0]) });
    S.lentille({ O: c([0, 0]), f: f * pas, h: (ymax - 0.25) * pas, foyers: o.foyers !== false });
    // sortie du cadre d'une demi-droite (P, d), en carreaux
    function bord(P, d) {
      let t = Infinity;
      if (d[0] > 1e-9) t = Math.min(t, (xmax - P[0]) / d[0]);
      if (d[0] < -1e-9) t = Math.min(t, (xmin - P[0]) / d[0]);
      if (d[1] > 1e-9) t = Math.min(t, (ymax - P[1]) / d[1]);
      if (d[1] < -1e-9) t = Math.min(t, (-ymax - P[1]) / d[1]);
      return V.add(P, V.mul(d, Math.max(0, t)));
    }
    const F = {
      S, f, pas, xmin, xmax, ymax, c, k, bord,
      rayon(cal, a, b, ro) { return S.rayon(cal, c(a), c(b), Object.assign({ fleche: 1, cls: 'opt-fin' }, ro || {})); },
      fleche(cal, a, b, cls) { return S.fleche(cal, c(a), c(b), cls); },
      // point marqué et son nom (décalé de o.dx, o.dy carreaux)
      point(cal, p, nom, po) {
        po = po || {};
        S.cercle(cal, c(p), 3.5, po.cls || 'opt-point');
        if (nom) S.texte('textes', c(V.add(p, [po.dx != null ? po.dx : -0.45, po.dy != null ? po.dy : 0.5])), nom, { cls: 'opt-nom-pt', couleur: po.couleur });
      },
      toucher: evt => k(S.point(evt)),
      // points remarquables (aimant)
      remarquables: () => [[0, 0], [-f, 0], [f, 0]],
    };
    return F;
  }

  /* ---------- Tracé d'un rayon au doigt ---------- */
  function tracer(F, cmd, o) {
    const S = F.S, I = o.I, aval = o.sens !== 'amont', juste = V.norm(o.juste);
    const cal = o.calque || 'rayons';
    const g = OPT.svgEl('g', { class: 'lt-essai' }, S.calque(cal));
    // point de départ : sur le quadrillage, du bon côté, mais pas sur le bon rayon
    let P0 = o.depart;
    if (!P0) {
      const x = aval ? Math.min(F.xmax - 1, 5) : Math.max(F.xmin + 1, -5);
      const cand = [2, -2, 1, -1, 3, -3].map(dy => [x, Math.round(I[1]) + dy]).filter(p => Math.abs(p[1]) < F.ymax - 0.5);
      P0 = cand.find(p => !estJuste(p)) || cand[0];
    }
    function estJuste(P) {
      const v = V.sub(P, I);
      if (V.len(v) < 0.9) return false;
      if (aval ? v[0] <= 0.05 : v[0] >= -0.05) return false;
      const dist = Math.abs(V.cross(v, juste));
      return dist <= 0.15 && V.dot(v, juste) > 0;
    }
    let P = P0.slice();
    function dessiner() {
      while (g.firstChild) g.removeChild(g.firstChild);
      const v = V.sub(P, I);
      if (V.len(v) < 1e-6) return;
      const d = V.norm(v), E = F.bord(I, d);
      if (aval) F.rayon(g, I, E, { cls: 'opt-fin opt-essai' });
      else F.rayon(g, E, I, { cls: 'opt-fin opt-essai' });
    }
    const aimant = q => {
      const p = F.k(q);
      const r = OPT.aimanter(p, { pas: 0.5, points: F.remarquables(), rayon: 0.3 });
      r[0] = Math.max(F.xmin + 0.5, Math.min(F.xmax - 0.5, r[0]));
      r[1] = Math.max(-F.ymax + 0.5, Math.min(F.ymax - 0.5, r[1]));
      return F.c(r);
    };
    const pg = OPT.poignee(S, {
      p: F.c(P), aimant, pas: F.pas * 0.5, aria: aval ? 'Point par où passe le rayon émergent' : 'Point par où passe le rayon incident',
      surChange(q) { P = F.k(q); dessiner(); if (o.surChange) o.surChange(P); },
    });
    dessiner();
    cmd.innerHTML = `<p class="lt-aide-t">Glisse le point rond par où passe le rayon ${aval ? 'qui sort de la lentille' : 'qui arrive sur la lentille'}, ou utilise ◀ ▶ ▲ ▼ (un demi-carreau par appui).</p>
      <div class="lt-trace-cmd"><span data-a="pave"></span><button type="button" class="btn-primary" data-a="ok">Valider le rayon</button></div>`;
    const bouger = (dx, dy) => pg.regler(F.c(V.add(P, [dx, dy])));
    OPT.pave(cmd.querySelector('[data-a="pave"]'), {
      gauche: () => bouger(-0.5, 0), droite: () => bouger(0.5, 0), haut: () => bouger(0, 0.5), bas: () => bouger(0, -0.5),
      aria: ['Déplacer le point d\'un demi-carreau vers la gauche', 'Déplacer le point d\'un demi-carreau vers la droite', 'Déplacer le point d\'un demi-carreau vers le haut', 'Déplacer le point d\'un demi-carreau vers le bas'],
    });
    let fini = false;
    function terminer() {
      fini = true;
      pg.retirer(); g.remove(); cmd.innerHTML = '';
    }
    cmd.querySelector('[data-a="ok"]').onclick = () => {
      if (fini) return;
      if (estJuste(P)) { terminer(); o.surJuste(); return; }
      const v = V.sub(P, I);
      let diag;
      if (V.len(v) < 0.9) diag = 'Éloigne le point de la lentille pour bien choisir la direction du rayon.';
      // point du mauvais côté de la lentille : par le mauvais foyer (o.diagCote), ou dévié avant la lentille
      else if (aval ? v[0] <= 0.05 : v[0] >= -0.05) diag = (o.diagCote && o.diagCote(P)) || (aval ? DIAG_LENTILLE + ' Le rayon émergent part de la lentille vers la droite.' : DIAG_LENTILLE + ' Le rayon incident arrive de la gauche sur la lentille.');
      else diag = o.diag(P);
      o.surErreur(diag);
    };
    return {
      montrer() { if (!fini) { terminer(); o.surJuste(true); } },
      quitter() { if (!fini) { fini = true; pg.retirer(); g.remove(); } },
      P: () => P.slice(),
      regler: p => pg.regler(F.c(p)),
    };
  }

  // point placé sur le foyer du mauvais côté : le rayon passe par F au lieu de F′ (ou l'inverse, à rebours)
  function diagFoyer(f, sens, type, types) {
    const Fx = sens === 'amont' ? f : -f;
    return P => (Math.abs(P[0] - Fx) < 0.3 && Math.abs(P[1]) < 0.3 ? types[type].diag : null);
  }

  // flèche « sens de la lumière » en haut à gauche de la figure
  function sensLumiere(F) {
    const y = F.ymax - 0.6, x = F.xmin + 0.4;
    F.S.fleche('textes', F.c([x, y]), F.c([x + 2.2, y]), 'opt-objet lt-sens');
    F.S.texte('textes', F.c([x + 2.5, y]), 'sens de la lumière', { ancre: 'start', taille: 12, cls: 'lt-g-txt' });
  }

  Object.assign(LT, { TYPES, TYPES_REBOURS, DIAG_LENTILLE, particulier, rebours, figure, tracer, diagFoyer, sensLumiere });
})();
