/* ============================================================
   Simulateur « énergies d'un skieur et d'une balle » (module 3, page sur
   un écran ; idée de « Energy Skate Park », sans la copier)

   ET.simEnergies(zone) :
   - deux situations : un skieur de 70 kg sur une piste (hauteur de départ,
     hauteur du sommet suivant, frottements ; dessin repris du skieur de
     bilan-forces/modules/situations.js, utilisé par « Lois de Newton ») ou une balle lancée
     verticalement (vitesse, hauteur de départ, masse, frottements de
     l'air) ; tout se règle à tout moment ;
   - barres E_c, E_pp, E_m et énergie perdue par frottements, avec leurs
     valeurs (option « À trouver » : valeurs masquées) ;
   - graphique E(t) ou E(z) tracé en direct (dans la figure sur ordinateur,
     onglet « Graphique » sur téléphone) ;
   - origine des altitudes déplaçable (▲ ▼ ou en glissant la ligne z = 0) :
     E_pp change, ΔE_pp non ;
   - Lecture / Pause, Pas à pas, vitesse × 0,5 × 1 × 2, ↺ Recommencer ;
     prefers-reduced-motion : avance par étapes.
   Modèle : mouvement le long de la piste (abscisse x, vitesse algébrique
   u le long de la piste), a = −g sin θ − (f/m) signe(u) ; après chaque
   petit pas, la valeur de la vitesse est recalculée par l'énergie
   (E_m initiale − énergie perdue − E_pp) : sans frottements, E_m se
   conserve exactement (à l'arrondi près).
   Défis « À essayer », dans n'importe quel ordre (cochés tout seuls) :
   sommet suivant ; altitude maximale d'une balle (calcul vérifié) ;
   conservation de E_m sans frottements (deux pauses) ; énergie perdue et
   force de frottement (balle lancée depuis le sol, frottements inconnus :
   f = énergie perdue / (2 z_max) sur tout le trajet, calcul vérifié) ; origine
   déplacée ; skieur arrêté par les frottements. Bilan ouvrable à tout
   moment.
   ============================================================ */
(function () {
  'use strict';
  const ET = window.ET;
  const { fmt, fl, txt, COUL, ENCRE, ENCRE2, ENCRE3, MS } = ET;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = 9.81;
  const n3 = v => (Math.abs(v) < 5e-4 ? '0' : fmt(+v.toPrecision(3)));
  const f1 = v => (Math.round(v * 10) / 10).toString();

  /* ---------- Piste : altitude y(x) (m) et pente y'(x) ---------- */
  const X_VAL = 20, X_SOM = 38, X_BAS = 54, X_FIN = 64;
  function piste(hA, hS) {
    const y = x => {
      if (x <= 0) return hA + .3 * x * x;          // petite remontée derrière le départ
      if (x <= X_VAL) return hA * Math.pow(1 - x / X_VAL, 2);
      if (x <= X_SOM) return hS * (1 - Math.cos(Math.PI * (x - X_VAL) / (X_SOM - X_VAL))) / 2;
      if (x <= X_BAS) return hS * (1 + Math.cos(Math.PI * (x - X_SOM) / (X_BAS - X_SOM))) / 2;
      return 0;
    };
    const dy = x => (y(x + 1e-4) - y(x - 1e-4)) / 2e-4;
    return { y, dy };
  }

  /* ---------- Skieur fléchi (repris de bilan-forces/modules/situations.js) ----------
     dessiné dans son repère : t le long de la piste (sens du mouvement : sens = 1 ou −1), h perpendiculaire
     (vers le haut) ; les skis reposent en h = 0 ; k : échelle. Renvoie [skis, corps] : les skis suivent la pente,
     le corps est moins incliné (il reste lisible sur une pente raide à l'écran) */
  function skieur(sens, k) {
    const p = (t, h) => [sens * t * 1.5 * k, -h * 1.5 * k];
    const s = (t, h) => p(t, h).map(f1).join(',');
    const membre = (pts, l) => {
      const d = 'M' + pts.map(q => q.map(f1).join(',')).join(' L');
      return `<path d="${d}" class="et-sk-membre" style="stroke-width:${f1((l + 3) * k)}"/><path d="${d}" class="et-sk-membre-in" style="stroke-width:${f1(l * k)}"/>`;
    };
    const che = p(0, 6), gen = p(2, 18), han = p(-7, 27), epa = p(-2, 42), tete = p(1, 51), mn = p(11, 30);
    const cou = [(epa[0] + mn[0]) / 2 + 4 * k * sens, (epa[1] + mn[1]) / 2 + 6 * k];
    const skis = `<path d="M${s(-30, 0)} L${s(26, 0)} Q${s(33, 0)} ${s(35, 5)}" class="et-sk-ski" style="stroke-width:${f1(5 * k)}"/>`;
    let g = membre([p(-3, 6), [gen[0] - 5 * k * sens, gen[1] + k], [han[0] - 4 * k * sens, han[1]]], 9);
    g += `<path d="M${s(-6, 1.5)} L${s(6, 1.5)} L${s(4, 10)} L${s(-3, 10)} Z" class="et-sk-chaussure"/>`;
    g += membre([che, gen, han], 10) + membre([han, epa], 16);
    g += `<line x1="${f1(mn[0])}" y1="${f1(mn[1])}" x2="${f1(p(-18, .5)[0])}" y2="${f1(p(-18, .5)[1])}" class="et-sk-baton"/>`;
    g += membre([epa, cou, mn], 8);
    const r = 15 * k;
    g += `<circle cx="${f1(tete[0])}" cy="${f1(tete[1])}" r="${f1(r)}" class="et-sk-tete"/>` +
      `<path d="M${f1(tete[0] - r * 1.05)},${f1(tete[1] + r * .05)} A${f1(r * 1.05)},${f1(r * 1.05)} 0 0 1 ${f1(tete[0] + r * 1.05)},${f1(tete[1] + r * .05)} Z" class="et-sk-casque"/>`;
    return [skis, g];
  }

  function simEnergies(zone) {
    const st = {
      mode: 'piste', hA: 6, hS: 5, mS: 70, fS: 0, v0: 10, h: 1, mB: 0.2, fB: 0,
      z0: 0, cache: false, fInconnu: null, graphe: 't', vit: 1,
      // état du mouvement
      t: 0, x: 0, u: 0, perte: 0, joue: false, fini: false, arret: false, passe: false, zmax: 0, sommetVu: false,
      pauses: [], ech: [], rep: {}, lance: false,
    };
    const c = ET.cadre(zone, {
      badge: 'MODULE 3 · SIMULATEUR', titre: 'Énergies d\'un skieur et d\'une balle',
      bas: `<div class="et-anim-ctrl"><button type="button" class="btn-primary et-lire" data-a="lire">▶ Lancer</button><button type="button" class="btn-secondary" data-a="pas">Pas à pas</button>
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <span class="et-seg" role="group" aria-label="Vitesse de l'animation">${[0.5, 1, 2].map(v => `<button type="button" data-vit="${v}" aria-pressed="${v === 1}">× ${fmt(v)}</button>`).join('')}</span></div>
        <p class="et-valeurs" data-a="val" aria-live="off"></p>`,
      onglets: [{ id: 'reg', nom: 'Réglages', sections: ['reg'] }, { id: 'gr', nom: 'Graphique', sections: ['gr'], tel: true },
        { id: 'defis', nom: 'Défis', sections: ['defis'] }, { id: 'bilan', nom: 'Bilan', sections: ['bilan'] }],
      sections: [
        { id: 'reg', html: `<div class="et-seg" role="group" aria-label="Situation"><button type="button" data-mode="piste" aria-pressed="true">Skieur sur une piste</button><button type="button" data-mode="balle" aria-pressed="false">Balle lancée</button></div>
            <div class="et-reglages" data-a="rPiste">${ET.reglage({ id: 'hA', nom: 'départ (m)', min: 1, max: 10, pas: .5, val: st.hA, aria: 'Hauteur de départ du skieur' })}${ET.reglage({ id: 'hS', nom: 'sommet (m)', min: 1, max: 10, pas: .5, val: st.hS, aria: 'Hauteur du sommet suivant' })}
              ${ET.reglage({ id: 'fS', nom: 'frottements f (N)', min: 0, max: 150, pas: 5, val: st.fS, aria: 'Force de frottement sur le skieur' })}<p class="et-lab">Masse du skieur : ${st.mS} kg</p></div>
            <div class="et-reglages" data-a="rBalle" hidden>${ET.reglage({ id: 'v0', nom: 'v<sub>0</sub> (m·s<sup>−1</sup>)', min: 0, max: 16, pas: .5, val: st.v0, aria: 'Vitesse de lancer, vers le haut' })}${ET.reglage({ id: 'h', nom: 'départ (m)', min: 0, max: 5, pas: .5, val: st.h, aria: 'Hauteur de départ de la balle' })}
              ${ET.reglage({ id: 'mB', nom: 'masse (kg)', min: .05, max: 1, pas: .05, val: st.mB, aria: 'Masse de la balle' })}${ET.reglage({ id: 'fB', nom: 'frottements f (N)', min: 0, max: 1, pas: .02, val: st.fB, aria: 'Force de frottement de l\'air sur la balle' })}</div>
            <p class="et-lab">Origine des altitudes (z = 0)</p>
            <div class="et-orig"><button type="button" class="btn-secondary" data-z="1" aria-label="Monter l'origine de 0,5 m">▲</button><button type="button" class="btn-secondary" data-z="-1" aria-label="Descendre l'origine de 0,5 m">▼</button>
              <button type="button" class="btn-small" data-z="0">au sol</button><span data-a="z0Txt"></span></div>
            <div class="et-seg" role="group" aria-label="Valeurs des énergies"><button type="button" data-cache="0" aria-pressed="true">Valeurs montrées</button><button type="button" data-cache="1" aria-pressed="false">À trouver</button></div>` },
        { id: 'gr', html: `${'<div class="et-seg" role="group" aria-label="Graphique">'}<button type="button" data-gr="t" aria-pressed="true">E(t)</button><button type="button" data-gr="z" aria-pressed="false">E(z)</button></div>
            <svg class="et-mini" data-a="grTel" viewBox="0 0 300 170" role="img" aria-label="Énergies en fonction du temps ou de l'altitude"></svg>` },
        { id: 'defis', html: '<div data-a="defis"></div>' },
        { id: 'bilan', html: `<div class="et-bilan"><div class="cle"><p>E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub>, avec E<sub>c</sub> = ½ m v² et E<sub>pp</sub> = m g z.</p></div>
            <div class="cle"><p><b>Sans frottements, E<sub>m</sub> se conserve</b> : E<sub>c</sub> et E<sub>pp</sub> s'échangent. Le skieur ne peut pas monter plus haut que son point de départ.</p></div>
            <div class="cle"><p><b>Avec frottements, E<sub>m</sub> diminue</b> : ΔE<sub>m</sub> = W(<span class="vec-nom">f</span>) = −f × d (énergie perdue, transformée en énergie thermique).</p></div>
            <div class="cle"><p>E<sub>pp</sub> dépend de l'origine des altitudes ; ses variations, non.</p></div></div>` },
      ],
      surOnglet: id => { if (id === 'bilan') window.SOM.marquer({ fait: true }); if (id === 'gr') grapheTel(); },
    });
    const $ = c.$;

    /* ---------- Modèle ---------- */
    const balle = () => st.mode === 'balle';
    const masse = () => (balle() ? st.mB : st.mS);
    const frott = () => (balle() ? (st.fInconnu != null ? st.fInconnu : st.fB) : st.fS);
    let P = piste(st.hA, st.hS);
    // altitude (au-dessus du sol) de la position x
    const alt = x => (balle() ? x : P.y(x));
    const Epp = x => masse() * g * (alt(x) - st.z0);
    const Em0 = () => (balle() ? .5 * st.mB * st.v0 * st.v0 + st.mB * g * (st.h - st.z0) : st.mS * g * (st.hA - st.z0));
    const vitesse = () => Math.abs(st.u);
    const Ec = () => .5 * masse() * st.u * st.u;
    function initialiser() {
      P = piste(st.hA, st.hS);
      st.t = 0; st.perte = 0; st.fini = false; st.arret = false; st.passe = false; st.sommetVu = false; st.pauses = []; st.ech = []; st.lance = false;
      if (balle()) { st.x = st.h; st.u = st.v0; } else { st.x = 0; st.u = 0; }
      st.zmax = alt(st.x);
      echantillon();
    }
    // échantillon pour le graphique : altitude et E_pp comptées depuis le sol (l'origine choisie s'applique au tracé)
    function echantillon() { st.ech.push({ t: st.t, zAbs: alt(st.x), Ec: Ec(), EppSol: masse() * g * alt(st.x), perte: st.perte }); }
    // un petit pas de durée dt
    function pas1(dt) {
      const m = masse(), f = frott();
      const pente = balle() ? 1e9 : P.dy(st.x);
      const cosT = balle() ? 0 : 1 / Math.sqrt(1 + pente * pente), sinT = balle() ? 1 : pente * cosT;
      const sgn = Math.abs(st.u) > 1e-9 ? Math.sign(st.u) : 0;
      // à l'arrêt : il repart seulement si la pente l'emporte sur les frottements
      if (!sgn && g * Math.abs(sinT) <= f / m + 1e-9) {
        if (!balle()) { st.arret = true; st.fini = true; }
        return;
      }
      let a = -g * sinT - (sgn || -Math.sign(sinT)) * f / m;
      const u1 = st.u + a * dt;
      const ds = (st.u + u1) / 2 * dt;                 // déplacement le long de la piste (m)
      const dx = balle() ? ds : ds * cosT;
      const x1 = st.x + dx;
      // changement de sens pendant le pas (sommet de la balle, demi-tour du skieur)
      if (sgn && Math.sign(u1) !== sgn) {
        const tz = Math.abs(st.u / a), dsz = st.u * tz / 2;
        st.x += balle() ? dsz : dsz * cosT; st.perte += f * Math.abs(dsz); st.u = 0; st.t += tz;
        if (balle()) st.sommetVu = true;
        return;
      }
      st.perte += f * Math.abs(ds);
      st.x = Math.max(balle() ? 0 : -3, x1);
      // valeur de la vitesse donnée par l'énergie (conservation exacte sans frottements)
      const E2 = Em0() - st.perte - Epp(st.x);
      if (E2 > 0) st.u = (Math.sign(u1) || 1) * Math.sqrt(2 * E2 / m); else st.u = 0;
      st.t += dt;
      st.zmax = Math.max(st.zmax, alt(st.x));
      if (!balle() && st.x >= X_SOM) st.passe = true;
      if (balle() && st.x <= 0 && st.t > 0) { st.x = 0; st.fini = true; }
      if (!balle() && st.x >= X_FIN) { st.x = X_FIN; st.fini = true; }
    }
    function avancer(duree) {
      const n = Math.max(1, Math.ceil(duree / .002));
      for (let k = 0; k < n && !st.fini; k++) pas1(duree / n);
      echantillon();
    }

    /* ---------- Dessin ---------- */
    let geo = null;
    function dessiner() {
      const r = c.fig.getBoundingClientRect(), W = Math.max(260, r.width), H = Math.max(180, r.height);
      const avecGr = !c.tel() && H >= 330;
      const Hs = avecGr ? Math.round(H * .58) : H, Wb = Math.min(190, Math.max(130, W * .26)), Ws = W - Wb;
      let d = `<rect width="${W}" height="${H}" fill="#fff"/>`;
      // ---- scène ----
      const zMaxScene = balle() ? Math.max(st.h + st.v0 * st.v0 / (2 * g), st.h, 1) : Math.max(st.hA, st.hS, 1);
      const Xmax = balle() ? 1 : X_FIN, mg = { g: 40, d: 16, h: 22, b: 26 };
      const zHaut = Math.max(zMaxScene, st.z0) * 1.12 + .3, zBas = Math.min(0, st.z0) - .3;
      const sy = (Hs - mg.h - mg.b) / (zHaut - zBas), sx = balle() ? 0 : (Ws - mg.g - mg.d) / Xmax;
      const py = z => Hs - mg.b - (z - zBas) * sy, px = x => (balle() ? mg.g + (Ws - mg.g - mg.d) * .45 : mg.g + x * sx);
      geo = { py, zBas, sy, Hs, Ws, mg };
      // graduations en altitude (repère choisi : z = 0 à l'origine)
      const brut = 28 / sy, p10 = Math.pow(10, Math.floor(Math.log10(brut))), pasZ = [1, 2, 5, 10].map(k => k * p10).find(k => k >= brut);
      for (let z = Math.ceil((zBas - st.z0) / pasZ) * pasZ; py(z + st.z0) >= mg.h - 2; z += pasZ) {
        d += `<line x1="${mg.g}" y1="${f1(py(z + st.z0))}" x2="${Ws - 6}" y2="${f1(py(z + st.z0))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>` + txt(mg.g - 5, py(z + st.z0) + 4, n3(z), { t: 10, a: 'end' });
      }
      d += fl(mg.g, Hs - 6, mg.g, 6, ENCRE, { ep: 1.2, lt: 7 }) + txt(mg.g + 6, 14, 'z (m)', { g: 700, c: ENCRE, t: 11 });
      // sol
      d += `<line x1="${mg.g}" y1="${f1(py(0))}" x2="${Ws - 4}" y2="${f1(py(0))}" stroke="${ENCRE2}" stroke-width="1.4"/>`;
      if (!balle()) {
        let p = '';
        for (let k = 0; k <= 160; k++) { const x = X_FIN * k / 160; p += `${k ? 'L' : 'M'}${f1(px(x))},${f1(py(P.y(x)))}`; }
        d += `<path d="${p}L${f1(px(X_FIN))},${f1(py(0) + 8)}L${f1(px(0))},${f1(py(0) + 8)}Z" fill="#ebe8e1" stroke="none"/><path d="${p}" fill="none" stroke="${ENCRE}" stroke-width="2.4"/>`;
        d += `<line x1="${f1(px(X_SOM))}" y1="${f1(py(st.hS) - 4)}" x2="${f1(px(X_SOM))}" y2="${f1(py(st.hS) - 16)}" stroke="${ENCRE2}" stroke-width="1.6"/><path d="M${f1(px(X_SOM))},${f1(py(st.hS) - 16)} l12,4 l-12,4 Z" fill="${st.passe ? '#16a34a' : ENCRE2}"/>`;
      } else {
        d += `<line x1="${f1(px(0) - 40)}" y1="${f1(py(0))}" x2="${f1(px(0) + 40)}" y2="${f1(py(0))}" stroke="${ENCRE}" stroke-width="2.4"/>`;
        if (st.zmax > st.h + .01) d += `<line x1="${f1(px(0) - 24)}" y1="${f1(py(st.zmax))}" x2="${f1(px(0) + 24)}" y2="${f1(py(st.zmax))}" stroke="${ENCRE3}" stroke-dasharray="4 3"/>` + txt(px(0) + 28, py(st.zmax) + 4, `z<tspan dy="3" font-size="8">max</tspan><tspan dy="-3"> = ${n3(st.zmax - st.z0)} m</tspan>`, { t: 10 });
      }
      // origine des altitudes (ligne à glisser)
      d += `<g data-a="origine" style="cursor:ns-resize"><line x1="${mg.g - 8}" y1="${f1(py(st.z0))}" x2="${Ws - 4}" y2="${f1(py(st.z0))}" stroke="${COUL.Epp}" stroke-width="1.6" stroke-dasharray="7 4"/>` +
        `<rect x="${Ws - 70}" y="${f1(py(st.z0) - 22)}" width="62" height="20" rx="10" fill="${COUL.Epp}"/>` + txt(Ws - 39, py(st.z0) - 8, 'z = 0 ⇅', { g: 800, c: '#fff', t: 11, a: 'middle' }) +
        `<rect x="${mg.g}" y="${f1(py(st.z0) - 16)}" width="${f1(Ws - mg.g)}" height="32" fill="transparent"/></g>`;
      // l'objet
      const X = px(st.x), Y = py(alt(st.x));
      if (balle()) d += `<circle cx="${f1(X)}" cy="${f1(Y - 7)}" r="7" fill="${COUL.Ec}" stroke="${ENCRE}" stroke-width="1.4"/>`;
      else {
        const a = Math.atan(P.dy(st.x) * sy / sx) * 180 / Math.PI;     // inclinaison à l'écran
        // skieur tourné dans le sens du mouvement (vers la droite au départ)
        if (st.u < -1e-6) st.sensSki = -1; else if (st.u > 1e-6) st.sensSki = 1;
        const [skis, corps] = skieur(st.sensSki || 1, .5);
        d += `<g transform="translate(${f1(X)},${f1(Y)})"><g transform="rotate(${f1(-a * .3)})">${corps}</g><g transform="rotate(${f1(-a)})">${skis}</g></g>`;
      }
      // vecteur vitesse, tangent à la piste (direction calculée à l'écran : échelles différentes en x et en z)
      if (vitesse() > .05) {
        let tx = 0, ty = -1;
        if (!balle()) { const x2 = st.x + .1; tx = px(x2) - X; ty = py(P.y(x2)) - Y; const n = Math.hypot(tx, ty); tx /= n; ty /= n; }
        const L = Math.min(70, 4 * vitesse()) * Math.sign(st.u), ox = balle() ? 16 : 0, oy = balle() ? -7 : -5;
        d += fl(X + ox, Y + oy, X + ox + tx * L, Y + oy + ty * L, COUL.v, { ep: 2, lt: 7 });
      }
      // ---- barres ----
      d += barres(Ws, 0, Wb, Hs);
      // ---- graphique (ordinateur) ----
      if (avecGr) d += graphe(0, Hs, W, H - Hs);
      if (!c.fig.querySelector('svg')) {
        c.fig.innerHTML = '<svg class="et-sim-svg" role="img" aria-label="Scène, barres des énergies et graphique"></svg>';
        brancherOrigine(c.fig.querySelector('svg'));
      }
      const sv = c.fig.querySelector('svg');
      sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
      sv.innerHTML = d;
      valeurs();
    }
    // échelle des barres : fixe pendant un mouvement
    function echelle() {
      const zH = balle() ? Math.max(st.h + st.v0 * st.v0 / (2 * g), st.h) : Math.max(st.hA, st.hS), m = masse();
      const e1 = Math.abs(m * g * (zH - st.z0)), e2 = Math.abs(m * g * (0 - st.z0)), e3 = Em0() - m * g * (0 - st.z0);
      return Math.max(e1, e2, e3, Math.abs(Em0()), 1e-6);
    }
    function barres(x0, y0, Wb, Hb) {
      const S = echelle(), neg = st.z0 > 0 ? Math.min(.45, (masse() * g * st.z0) / (S + masse() * g * st.z0)) : 0;
      const haut = y0 + 40, bas = y0 + Hb - 34, y0b = haut + (bas - haut) * (1 - neg), k = (y0b - haut) / S;
      const vals = [['E<tspan dy="3" font-size="8">c</tspan>', Ec(), COUL.Ec], ['E<tspan dy="3" font-size="8">pp</tspan>', Epp(st.x), COUL.Epp], ['E<tspan dy="3" font-size="8">m</tspan>', Ec() + Epp(st.x), COUL.Em], ['perdue', st.perte, COUL.perte]];
      const lw = (Wb - 14) / 4;
      let d = `<line x1="${x0 + 4}" y1="${f1(y0b)}" x2="${x0 + Wb - 4}" y2="${f1(y0b)}" stroke="${ENCRE}" stroke-width="1.2"/>` + txt(x0 + Wb / 2, y0 + 14, 'Énergies (J)', { g: 800, c: ENCRE, t: 11, a: 'middle' });
      vals.forEach(([n, v, col], i) => {
        const x = x0 + 8 + i * lw, hpx = Math.max(-(bas - y0b), Math.min(y0b - haut, v * k));
        d += `<rect x="${f1(x + 3)}" y="${f1(hpx >= 0 ? y0b - hpx : y0b)}" width="${f1(lw - 6)}" height="${f1(Math.abs(hpx))}" fill="${col}" rx="2"/>`;
        d += txt(x + lw / 2, bas + 14, n, { g: 800, c: col, t: 10, a: 'middle' });
        if (!st.cache) d += txt(x + lw / 2, hpx >= 0 ? y0b - hpx - 4 : y0b - hpx + 11, n3(v), { g: 700, c: ENCRE, t: 9, a: 'middle' });
      });
      return d;
    }
    // graphique E(t) ou E(z) dans le rectangle (x0, y0, W, H)
    function graphe(x0, y0, W, H) {
      const e = st.ech, mg = { g: 44, d: 14, h: 18, b: 24 };
      const S = echelle(), ymin = Math.min(0, -masse() * g * st.z0) * 1.05, ymax = S * 1.08;
      const parZ = st.graphe === 'z', T = parZ ? null : Math.max(1, e.length ? e[e.length - 1].t : 1);
      const zH = balle() ? Math.max(st.h + st.v0 * st.v0 / (2 * g), st.h, 1) : Math.max(st.hA, st.hS, 1);
      const zmin = Math.min(0, -st.z0), zmax = zH - st.z0;
      const X = v => x0 + mg.g + (parZ ? (v - zmin) / Math.max(zmax - zmin, 1e-6) : v / T) * (W - mg.g - mg.d), Y = v => y0 + mg.h + (ymax - v) / (ymax - ymin) * (H - mg.h - mg.b);
      let d = `<line x1="${x0 + mg.g}" y1="${f1(Y(0))}" x2="${x0 + W - 6}" y2="${f1(Y(0))}" stroke="${ENCRE}" stroke-width="1.1"/><line x1="${x0 + mg.g}" y1="${f1(y0 + H - mg.b)}" x2="${x0 + mg.g}" y2="${y0 + 6}" stroke="${ENCRE}" stroke-width="1.1"/>`;
      d += txt(x0 + mg.g + 4, y0 + 12, 'E (J)', { g: 700, c: ENCRE, t: 10 }) + txt(x0 + W - 6, Y(0) - 5, parZ ? 'z (m)' : 't (s)', { g: 700, c: ENCRE, t: 10, a: 'end' });
      d += txt(x0 + mg.g - 4, Y(S) + 4, n3(S), { t: 9, a: 'end' }) + `<line x1="${x0 + mg.g}" y1="${f1(Y(S))}" x2="${x0 + W - 6}" y2="${f1(Y(S))}" stroke="${COUL.grille}" stroke-dasharray="3 3"/>`;
      d += txt(X(parZ ? zmax : T), Y(0) + 13, n3(parZ ? zmax : T), { t: 9, a: 'middle' });
      if (parZ && zmin < 0) d += txt(X(zmin), Y(0) + 13, n3(zmin), { t: 9, a: 'middle' });
      const series = [['Ec', COUL.Ec], ['Epp', COUL.Epp], ['Em', COUL.Em]];
      series.forEach(([k, col]) => {
        let p = '';
        const dz = masse() * g * st.z0;
        e.forEach((q, i) => { const ep = q.EppSol - dz, v = k === 'Em' ? q.Ec + ep : k === 'Epp' ? ep : q.Ec; p += `${i ? 'L' : 'M'}${f1(X(parZ ? q.zAbs - st.z0 : q.t))},${f1(Y(v))}`; });
        if (p) d += `<path d="${p}" fill="none" stroke="${col}" stroke-width="2.2"/>`;
      });
      // légende
      [['E<tspan dy="3" font-size="8">c</tspan>', COUL.Ec], ['E<tspan dy="3" font-size="8">pp</tspan>', COUL.Epp], ['E<tspan dy="3" font-size="8">m</tspan>', COUL.Em]].forEach(([n, col], i) => {
        d += `<rect x="${x0 + mg.g + 50 + i * 50}" y="${y0 + 4}" width="12" height="4" fill="${col}"/>` + txt(x0 + mg.g + 66 + i * 50, y0 + 10, n, { g: 800, c: col, t: 10 });
      });
      return d;
    }
    function grapheTel() {
      const sv = $('grTel');
      if (sv) sv.innerHTML = graphe(0, 0, 300, 170);
    }
    function valeurs() {
      const z = alt(st.x) - st.z0, cache = st.cache, E = v => (cache ? '?' : n3(v) + ' J');
      $('val').innerHTML = `t = <b>${n3(st.t)} s</b> · z = <b>${n3(z)} m</b> · v = <b>${n3(vitesse())} ${MS}</b> · E<sub>c</sub> = <b>${E(Ec())}</b> · E<sub>pp</sub> = <b>${E(Epp(st.x))}</b> · E<sub>m</sub> = <b>${E(Ec() + Epp(st.x))}</b> · perdue : <b>${E(st.perte)}</b>`;
      $('z0Txt').innerHTML = st.z0 ? `origine à ${n3(st.z0)} m au-dessus du sol` : 'origine au sol';
      if (c.zone.querySelector('[data-s="gr"].actif')) grapheTel();
    }

    /* ---------- Origine des altitudes : glisser la ligne ---------- */
    function brancherOrigine(sv) {
      let prise = null;
      const zDe = e => { const r = sv.getBoundingClientRect(), H = r.height, y = (e.clientY - r.top) * (sv.viewBox.baseVal.height / H); return geo.zBas + (geo.Hs - geo.mg.b - y) / geo.sy; };
      sv.addEventListener('pointerdown', e => {
        if (!e.target.closest('[data-a="origine"]')) return;
        prise = e.pointerId; try { sv.setPointerCapture(e.pointerId); } catch (er) { /* rien */ }
        sv.style.touchAction = 'none'; e.preventDefault();
      });
      sv.addEventListener('pointermove', e => { if (prise !== e.pointerId) return; origine(Math.round(zDe(e) * 2) / 2); });
      const lacher = e => { if (prise === e.pointerId) { prise = null; sv.style.touchAction = ''; verifier(); } };
      sv.addEventListener('pointerup', lacher); sv.addEventListener('pointercancel', lacher);
    }
    function origine(z) {
      const zH = balle() ? st.h + st.v0 * st.v0 / (2 * g) : Math.max(st.hA, st.hS);
      z = Math.max(-2, Math.min(Math.ceil(zH), z));
      if (z === st.z0) return;
      st.z0 = z;                       // les courbes déjà tracées passent dans le nouveau repère (voir graphe)
      dessiner();
    }

    /* ---------- Animation ---------- */
    let rafId = null, dernier = 0;
    function majBoutons() { $('lire').textContent = reduit ? '▶ Étape suivante' : st.joue ? '❚❚ Pause' : st.t > 0 && !st.fini ? '▶ Reprendre' : '▶ Lancer'; }
    function arreter() { st.joue = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; majBoutons(); }
    function finMouvement() {
      arreter();
      if (st.arret) c.message(`Le skieur s'est arrêté : les frottements ont dissipé ${n3(st.perte)} J.`, 'info');
      else if (balle()) c.message(`La balle est retombée au sol après ${n3(st.t)} s ; altitude maximale atteinte : z = ${n3(st.zmax - st.z0)} m.`, 'info');
      else c.message(`Le skieur a passé le sommet et termine la piste à ${n3(vitesse())} ${MS}.`, 'info');
      verifier();
    }
    function boucle(ts) {
      const dt = Math.min(.05, (ts - dernier) / 1000) * st.vit;
      dernier = ts;
      const avant = st.sommetVu;
      avancer(dt);
      if (balle() && !avant && st.sommetVu) c.message(`Sommet : z<sub>max</sub> = ${n3(st.zmax - st.z0)} m ; E<sub>m</sub> = ${st.cache ? '?' : n3(Ec() + Epp(st.x)) + ' J'}.`, 'info');
      dessiner();
      if (st.fini) { finMouvement(); return; }
      rafId = requestAnimationFrame(boucle);
    }
    function lancer() {
      if (st.joue) { arreter(); noterPause(); verifier(); return; }
      if (st.fini) initialiser();
      c.message('');
      st.lance = true;
      if (reduit) { pas(); return; }
      st.joue = true; majBoutons(); dernier = performance.now(); rafId = requestAnimationFrame(boucle);
    }
    function pas() {
      arreter();
      if (st.fini) initialiser();
      st.lance = true;
      avancer(.15);
      dessiner();
      if (st.fini) finMouvement(); else { noterPause(); verifier(); }
      majBoutons();
    }
    function noterPause() { if (st.t > 0 && !st.fini) st.pauses.push({ t: st.t, Em: Ec() + Epp(st.x), f: frott() }); }
    function recommencer() { arreter(); initialiser(); c.message(''); dessiner(); verifier(); majBoutons(); }
    $('lire').onclick = lancer; $('pas').onclick = pas; $('re').onclick = recommencer;
    zone.querySelectorAll('[data-vit]').forEach(b => { b.onclick = () => { st.vit = +b.dataset.vit; zone.querySelectorAll('[data-vit]').forEach(x => x.setAttribute('aria-pressed', x === b)); }; });

    /* ---------- Réglages ---------- */
    const FMT = { hA: fmt, hS: fmt, fS: fmt, v0: fmt, h: fmt, mB: v => fmt(v, 2), fB: v => fmt(v, 2) };
    function regler(k, v) {
      st[k] = v;
      if (k === 'fB') st.fInconnu = null;
      const i = zone.querySelector(`[data-r="${k}"]`); if (i && +i.value !== v) i.value = v;
      arreter(); initialiser(); majReglages(); c.message(''); dessiner(); verifier();
    }
    function majReglages() {
      Object.keys(FMT).forEach(k => { const b = zone.querySelector(`[data-v="${k}"]`); if (b) b.textContent = k === 'fB' && st.fInconnu != null ? '?' : FMT[k](st[k]); });
      zone.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));
      zone.querySelectorAll('[data-cache]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.cache === '1') === st.cache));
      zone.querySelectorAll('[data-gr]').forEach(b => b.setAttribute('aria-pressed', b.dataset.gr === st.graphe));
      $('rPiste').hidden = balle(); $('rBalle').hidden = !balle();
    }
    zone.querySelectorAll('[data-r]').forEach(i => { i.addEventListener('input', () => regler(i.dataset.r, +i.value)); });
    zone.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => { st.mode = b.dataset.mode; arreter(); initialiser(); majReglages(); c.message(''); dessiner(); verifier(); }; });
    zone.querySelectorAll('[data-cache]').forEach(b => { b.onclick = () => { st.cache = b.dataset.cache === '1'; majReglages(); dessiner(); }; });
    zone.querySelectorAll('[data-gr]').forEach(b => { b.onclick = () => { st.graphe = b.dataset.gr; majReglages(); dessiner(); }; });
    zone.querySelectorAll('[data-z]').forEach(b => { b.onclick = () => { const k = +b.dataset.z; origine(k ? st.z0 + k * .5 : 0); verifier(); }; });

    /* ---------- Défis ---------- */
    const prep = (o, onglet) => () => {
      Object.keys(o).forEach(k => { st[k] = o[k]; const i = zone.querySelector(`[data-r="${k}"]`); if (i) i.value = o[k]; });
      if (!('fInconnu' in o)) st.fInconnu = null;
      arreter(); initialiser(); majReglages(); c.message(''); dessiner(); verifier();
      if (c.tel()) c.onglet(onglet || 'reg');
    };
    const zmaxTh = () => st.h + st.v0 * st.v0 / (2 * g);
    const CHAMP = (id, lab, unite) => `<span class="et-defi-rep"><span>${lab}</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" data-rep="${id}" aria-label="${lab.replace(/<[^>]+>/g, '')}"><span>${unite}</span><span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span><button type="button" class="btn-small" data-ok="${id}">Vérifier</button></span><span class="et-defi-msg" data-msg="${id}"></span>`;
    const defis = ET.defis($('defis'), [
      { t: 'Le skieur part de 5 m : règle la piste pour qu\'il <b>passe le sommet suivant</b>, sans frottements, puis lance.', preparer: prep({ mode: 'piste', hA: 5, hS: 6, fS: 0, z0: 0 }),
        ok: () => st.mode === 'piste' && st.passe },
      { t: `Balle lancée à 8,0 ${MS} depuis 1,0 m, sans frottements : <b>calcule son altitude maximale</b> (origine au sol), puis lance pour vérifier.<br>` + CHAMP('zmax', 'z<sub>max</sub> =', 'm'), preparer: prep({ mode: 'balle', v0: 8, h: 1, fB: 0, z0: 0 }),
        ok: () => st.rep.zmax === true },
      { t: 'Sans frottements, lance un mouvement et <b>mets-le en pause à deux instants</b> différents : compare E<sub>m</sub>.', preparer: prep({ fS: 0, fB: 0 }),
        ok: () => { const p = st.pauses.filter(q => q.f === 0); return p.length >= 2 && Math.abs(p[p.length - 1].t - p[0].t) > .2 && Math.abs(p[p.length - 1].Em - p[0].Em) <= .001 * Math.abs(p[0].Em || 1); } },
      { t: `Frottements de l'air <b>inconnus</b> : lance la balle depuis le sol (0,20 kg, 12 ${MS}) et attends qu'elle retombe. Sur tout le trajet, l'énergie perdue vaut −ΔE<sub>m</sub> = f × d, avec d = 2 z<sub>max</sub> (montée et descente) : lis l'énergie perdue et z<sub>max</sub>, puis <b>déduis f</b>.<br>` + CHAMP('f', 'f =', 'N'),
        preparer: () => { prep({ mode: 'balle', v0: 12, h: 0, mB: .2, fInconnu: [0.1, 0.12, 0.16, 0.2][Math.floor(Math.random() * 4)], cache: false, z0: 0 })(); },
        ok: () => st.rep.f === true },
      { t: 'Déplace l\'<b>origine des altitudes</b> (▲ ▼ ou glisse la ligne z = 0), puis lance : E<sub>pp</sub> change, mais pas ses variations.', preparer: prep({ z0: 0 }),
        ok: () => st.z0 !== 0 && st.lance },
      { t: 'Avec des frottements, fais <b>s\'arrêter le skieur</b> dans le creux : regarde l\'énergie perdue.', preparer: prep({ mode: 'piste', hA: 6, hS: 7, fS: 60, z0: 0 }),
        ok: () => st.mode === 'piste' && st.arret && st.fS > 0 },
    ], {
      bilan: '<b>Tous les défis sont réussis !</b> Ouvre le « Bilan ».',
      surReussite: () => { if (c.tel()) setTimeout(() => c.onglet('defis'), 0); },
      apres: (i, z) => {
        const inp = z.querySelector('[data-rep]');
        if (!inp) return;
        const id = inp.dataset.rep, bt = z.querySelector(`[data-ok="${id}"]`), msg = z.querySelector(`[data-msg="${id}"]`);
        if (typeof st.rep[id + 'Txt'] === 'string') inp.value = st.rep[id + 'Txt'];
        inp.addEventListener('input', () => { st.rep[id + 'Txt'] = inp.value; msg.innerHTML = ''; });
        const tester = () => {
          const v = ET.lire(inp.value);
          if (isNaN(v)) { msg.innerHTML = 'Écris un nombre.'; return; }
          let bon, attendu;
          if (id === 'zmax') { attendu = zmaxTh(); bon = st.mode === 'balle' && st.fB === 0 && st.fInconnu == null && ET.proche(v, attendu - st.z0, .02); }
          else { attendu = st.fInconnu; bon = attendu != null && ET.proche(v, attendu, .06); }
          if (bon) { st.rep[id] = true; verifier(); return; }
          msg.innerHTML = id === 'zmax' ? (st.mode !== 'balle' || st.fB ? 'Reviens à la situation du défi (bouton « Essayer »).' : 'Pas tout à fait : E<sub>m</sub> au départ = E<sub>m</sub> au sommet, avec v = 0 au sommet.')
            : (attendu == null ? 'Clique d\'abord sur « Essayer ».' : 'Pas tout à fait : f = énergie perdue / d, avec d = 2 z<sub>max</sub> (la balle monte puis redescend).');
        };
        bt.onclick = tester;
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tester(); } });
      },
    });
    function verifier() { defis.verifier(); }

    const redim = () => dessiner();
    if (window.ResizeObserver) new ResizeObserver(redim).observe(c.fig); else addEventListener('resize', redim);
    initialiser(); majReglages(); dessiner(); majBoutons();
    ET.simEtat = st;               // (utile pour vérifier l'application)
  }

  ET.simEnergies = simEnergies;
})();
