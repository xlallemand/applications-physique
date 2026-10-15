/* ============================================================
   Travail d'une force : simulateur, wagon, trajets
   (application « Chapitre 7 : Théorème de l'énergie cinétique » ;
   à charger après ec.js)

   EC.Simu(zone, opts)       simulateur : un chariot va de A à B, tiré par une force F⃗
                             faisant l'angle α avec le déplacement. On règle F (0 à 20 N),
                             AB (0 à 2 m, curseur ou point B à faire glisser) et α (−180° à 180°
                             par pas de 5°, aimant sur 0°, 45°, 90°, 135°, 180°, −90° ; on peut
                             aussi faire tourner la flèche). Affichage en direct : flèche et angle,
                             projection de <span class="vec-nom">F</span> sur le déplacement (pointillés), W en joules,
                             « moteur / nul / résistant », jauge de l'énergie fournie ou retirée,
                             chariot animé qui accélère ou ralentit.
                             opts = { F, AB, alpha (réglages de départ), boutons (cas α = 0°, 90°,
                                      180° avec leur encadré), chariot (bouton « Lancer »), onChange(état) }
                             → { etat() : { F, AB, alpha, W }, regler({ F, AB, alpha }), el }
                             Plusieurs simulateurs peuvent exister dans la même page.
   EC.wagonSchema()          scène du wagon tiré par cinq personnages, avec une bulle
                             (case EC.slot) près de chacun : partie 'schema' de ec.js
   EC.Chemins(zone, opts)    quatre trajets de A à B pour la même force (10 N, parallèle à AB) :
                             le travail s'accumule pendant le trajet ; opts.onTrajet(n, W)
                             → { faits (Set des trajets faits), surFait(f) }
   EC.partieTableauW(o)      partie de question : tableau de valeurs de F, α, AB où l'élève écrit
                             le travail W lu sur le simulateur ; o = { q, lignes: [[F, α, AB]], solution }
   EC.travailDe(F, AB, α)    W = F × AB × cos α (cos 90° = 0 exactement)
   ============================================================ */
(function () {
  'use strict';

  const { el, fmt, cs, lire, secouer, champ, boutonValider, fleche, nomSVG, COUL, trait } = window.EC;
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f1 = v => (+v).toFixed(1);
  // cosinus d'un angle en degrés, arrondi (cos 90° vaut 0, pas 6 × 10⁻¹⁷)
  const cosd = a => { const c = Math.cos(a * Math.PI / 180); return Math.abs(c) < 1e-9 ? 0 : Math.round(c * 1e12) / 1e12; };
  const travailDe = (F, AB, a) => F * AB * cosd(a);
  // W en joules, deux chiffres significatifs
  const ecrireW = w => (Math.abs(w) < 1e-9 ? '0' : cs(w, 2)) + ' J';
  const nature = w => (w > 1e-9 ? 'moteur' : w < -1e-9 ? 'résistant' : 'nul');
  const AIMANTS = [0, 45, 90, 135, 180, -180, -90];
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  // angle « aimanté » : arrondi à 5°, attiré par 0°, 45°, 90°, 135°, 180°, −90° à moins de 4°
  function aimanter(brut) {
    const m = AIMANTS.find(x => Math.abs(brut - x) <= 4);
    return m != null ? m : borne(Math.round(brut / 5) * 5, -180, 180);
  }

  // encadrés des cas particuliers (sans la formule : elle se découvre plus loin)
  const CAS = {
    0: '<p><b class="cle-titre">α = 0°.</b> La force tire dans le <b>sens du déplacement</b> : toute la force sert à faire avancer le chariot. Le travail est <b>moteur et maximal</b> : W = F × AB.</p>',
    90: '<p><b class="cle-titre">α = 90°.</b> La force est <b>perpendiculaire au déplacement</b> : elle ne fait ni avancer ni reculer le chariot. Le travail est <b>nul</b> : W = 0.</p>',
    180: '<p><b class="cle-titre">α = 180°.</b> La force tire dans le <b>sens contraire du déplacement</b> : elle freine le chariot. Le travail est <b>résistant et maximal en valeur absolue</b> : W = −F × AB, la perte d\'énergie est la plus grande possible.</p>',
  };
  const casDe = a => (a === 0 ? 0 : Math.abs(a) === 90 ? 90 : Math.abs(a) === 180 ? 180 : null);

  /* ============================================================
     LE SIMULATEUR
     ============================================================ */
  function Simu(zone, opts) {
    opts = Object.assign({ F: 10, AB: 1, alpha: 0, boutons: true, chariot: true }, opts);
    const etat = { F: opts.F, AB: opts.AB, alpha: opts.alpha };
    const racine = el('div', 'ec-simu');
    racine.innerHTML = `
      <div class="ec-simu-scene"></div>
      <div class="ec-simu-lecture" aria-live="polite">
        <p class="ec-simu-w">W = <b data-a="w"></b></p>
        <p class="ec-simu-nat" data-a="nat"></p>
        <p class="ec-simu-proj" data-a="proj"></p>
      </div>
      <div class="ec-jauge" data-a="jauge" role="img">
        <div class="ec-jauge-barre"><span class="ec-jauge-rempli" data-a="rempli"></span><span class="ec-jauge-zero"></span></div>
        <div class="ec-jauge-leg"><span><b data-a="jmin"></b> énergie retirée</span><span class="ec-jauge-0">0</span><span><b data-a="jmax"></b> énergie fournie</span></div>
      </div>
      <div class="ec-reglages">
        <label class="ec-reglage"><span class="ec-reglage-nom">F = <b data-a="vF"></b></span><input type="range" min="0" max="20" step="1" data-r="F" aria-label="Valeur de la force F, en newtons"></label>
        <label class="ec-reglage"><span class="ec-reglage-nom">AB = <b data-a="vAB"></b></span><input type="range" min="0" max="2" step="0.1" data-r="AB" aria-label="Distance AB, en mètres"></label>
        <label class="ec-reglage"><span class="ec-reglage-nom">α = <b data-a="va"></b></span><input type="range" min="-180" max="180" step="1" data-r="alpha" aria-label="Angle alpha entre la force et le déplacement, en degrés"></label>
      </div>
      ${opts.boutons || opts.chariot ? `<div class="ec-simu-boutons">
        ${opts.boutons ? [0, 90, 180].map(a => `<button type="button" class="btn-secondary" data-cas="${a}">α = ${a}°</button>`).join('') : ''}
        ${opts.chariot ? '<button type="button" class="btn-primary" data-a="lancer">▶ Lancer le chariot</button>' : ''}</div>` : ''}
      <p class="ec-simu-etat" data-a="etat" aria-live="polite"></p>
      ${opts.boutons ? '<div class="cle ec-simu-cas" data-a="cas" hidden></div>' : ''}`;
    zone.appendChild(racine);
    const $ = s => racine.querySelector(s);
    const scene = $('.ec-simu-scene'), rF = $('[data-r="F"]'), rAB = $('[data-r="AB"]'), rA = $('[data-r="alpha"]');
    let largeur = 0, geo = null, anim = null, pos = 0;          // pos : distance parcourue depuis A (m)

    // géométrie de la scène pour la largeur W
    function geometrie(W) {
      const Lmax = W < 420 ? 60 : 96, mg = Lmax + (W < 420 ? 18 : 30);
      const ppm = Math.max(40, (W - 2 * mg) / 2), yG = Lmax + 30;
      return { W, Lmax, kF: Lmax / 20, mg, ppm, yG, rail: yG + 19, H: yG + Math.max(Lmax, 52) + 18 };
    }
    function dessiner() {
      if (!geo) return;
      const { W, Lmax, kF, mg, ppm, yG, rail, H } = geo, { F, AB, alpha } = etat;
      const xA = mg, xB = xA + AB * ppm, x = xA + pos * ppm;
      let g = `<line x1="8" y1="${rail}" x2="${W - 8}" y2="${rail}" class="ec-sc-sol"/>`;
      for (let t = 14; t < W - 8; t += 16) g += `<line x1="${t}" y1="${rail + 1}" x2="${t - 7}" y2="${rail + 8}" class="ec-sc-hach"/>`;
      // A, B et le déplacement
      if (AB > 0) g += `<line x1="${f1(xA)}" y1="${rail}" x2="${f1(Math.max(xA, xB - 9))}" y2="${rail}" class="ec-sc-dep"/><path d="M${f1(xB)},${rail} l-10,-5 v10 Z" class="ec-sc-dep-p"/>`;
      g += `<text x="${f1(xA)}" y="${rail + 24}" text-anchor="middle" class="ec-sc-pt">A</text>`;
      g += `<text x="${f1(xB)}" y="${rail + 24}" text-anchor="middle" class="ec-sc-pt">B</text>`;
      if (xB - xA > 90) g += `<text x="${f1((xA + xB) / 2)}" y="${rail + 24}" text-anchor="middle" class="ec-sc-txt">AB = ${fmt(AB, 1)} m</text>`;
      // le chariot
      g += `<rect x="${f1(x - 22)}" y="${yG - 13}" width="44" height="24" rx="4" class="ec-sc-sys"/>` +
        `<circle cx="${f1(x - 12)}" cy="${rail - 5}" r="5" class="ec-sc-roue"/><circle cx="${f1(x + 12)}" cy="${rail - 5}" r="5" class="ec-sc-roue"/>`;
      // direction du déplacement (référence de l'angle), arc et valeur de α
      g += `<line x1="${f1(x)}" y1="${yG}" x2="${f1(x + Lmax + 14)}" y2="${yG}" class="ec-sc-ref"/>`;
      if (F > 0 && alpha !== 0) {
        const r = alpha * Math.PI / 180, R = 22;
        g += `<path d="M${f1(x + R)},${yG} A${R},${R} 0 0 ${alpha > 0 ? 0 : 1} ${f1(x + R * Math.cos(r))},${f1(yG - R * Math.sin(r))}" class="ec-sc-arc"/>`;
      }
      // la lettre α près de l'arc, sur la bissectrice (la valeur est écrite sous le dessin)
      if (F > 0 && alpha !== 0) {
        const ra = alpha / 2 * Math.PI / 180;
        g += `<text x="${f1(x + 32 * Math.cos(ra))}" y="${f1(yG - 32 * Math.sin(ra) + 5)}" text-anchor="middle" class="ec-sc-alpha">α</text>`;
      }
      // projection de F⃗ sur le déplacement, en pointillés
      const c = cosd(alpha), Lp = F * kF * c;
      if (F > 0 && c !== 0 && Math.abs(c) !== 1) {
        const r = alpha * Math.PI / 180, tx = x + F * kF * Math.cos(r), ty = yG - F * kF * Math.sin(r);
        g += `<line x1="${f1(tx)}" y1="${f1(ty)}" x2="${f1(x + Lp)}" y2="${yG}" class="ec-sc-perp"/>`;
        g += `<g class="ec-proj">${trait(x, yG, x + Lp, yG, 'ec-tr ec-tr-proj')}</g>`;
      }
      // la force
      if (F > 0) {
        const a = fleche(x, yG, alpha, F * kF, COUL.F);
        g += a.svg + nomSVG('F', a.x2 + a.c * 14 + (Math.abs(a.c) < .3 ? 11 : 0), a.y2 + a.s * 14 + 6, COUL.F);
        // poignée pour faire tourner la flèche
        g += `<circle cx="${f1(a.x2)}" cy="${f1(a.y2)}" r="16" class="ec-poignee" data-p="fleche"><title>Fais tourner la force</title></circle>`;
      }
      // poignée du point B
      g += `<circle cx="${f1(xB)}" cy="${rail}" r="7" class="ec-pt-b"/><circle cx="${f1(xB)}" cy="${rail}" r="18" class="ec-poignee" data-p="B"><title>Fais glisser B</title></circle>`;
      scene.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ec-simu-svg" role="img" aria-label="Chariot tiré de A vers B par une force de ${F} N faisant un angle de ${alpha}° avec le déplacement ; AB = ${fmt(AB, 1)} m">${g}</svg>`;
    }
    // lectures : W, nature, projection, jauge, réglages
    function lire() {
      const { F, AB, alpha } = etat, w = travailDe(F, AB, alpha), max = F * AB;
      $('[data-a="w"]').textContent = ecrireW(w);
      $('[data-a="nat"]').textContent = 'travail ' + nature(w);
      $('[data-a="nat"]').dataset.nat = nature(w);
      $('[data-a="proj"]').textContent = `projection de la force sur le déplacement (en pointillés) : ${fmt(Math.round(F * cosd(alpha) * 10) / 10, 1)} N`;
      $('[data-a="jmin"]').textContent = (max ? '−' + fmt(max) : '0') + ' J';
      $('[data-a="jmax"]').textContent = (max ? '+' + fmt(max) : '0') + ' J';
      const p = max ? Math.abs(w) / max * 50 : 0, rempli = $('[data-a="rempli"]');
      rempli.style.width = p + '%';
      rempli.style.left = w < 0 ? (50 - p) + '%' : '50%';
      $('[data-a="jauge"]').setAttribute('aria-label', `Jauge : ${w > 0 ? 'énergie fournie au chariot' : w < 0 ? 'énergie retirée au chariot' : 'aucune énergie échangée'}, ${ecrireW(Math.abs(w))} sur ${fmt(max)} J au plus`);
      $('[data-a="vF"]').textContent = F + ' N';
      $('[data-a="vAB"]').textContent = fmt(AB, 1) + ' m';
      $('[data-a="va"]').textContent = String(etat.alpha).replace('-', '−') + '°';
      rF.value = F; rAB.value = AB; rA.value = alpha;
      const cas = $('[data-a="cas"]');
      if (cas) {
        const k = casDe(alpha);
        cas.hidden = k == null;
        if (k != null) cas.innerHTML = CAS[k];
        racine.querySelectorAll('[data-cas]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.cas === k)));
      }
      if (opts.onChange) opts.onChange(api.etat());
    }
    function changer(n) {
      Object.assign(etat, n);
      etat.F = borne(Math.round(etat.F), 0, 20);
      etat.AB = borne(Math.round(etat.AB * 10) / 10, 0, 2);
      arreter();
      pos = 0;
      $('[data-a="etat"]').textContent = '';
      lire(); dessiner();
    }

    // curseurs ; α : aimant, et pas de 5° au clavier
    rF.addEventListener('input', () => changer({ F: +rF.value }));
    rAB.addEventListener('input', () => changer({ AB: +rAB.value }));
    rA.addEventListener('input', () => changer({ alpha: aimanter(+rA.value) }));
    rA.addEventListener('keydown', e => {
      const pas = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 45, PageDown: -45 }[e.key];
      if (pas == null && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      changer({ alpha: e.key === 'Home' ? -180 : e.key === 'End' ? 180 : borne(etat.alpha + pas, -180, 180) });
    });
    racine.querySelectorAll('[data-cas]').forEach(b => { b.onclick = () => changer({ alpha: +b.dataset.cas }); });

    // glisser B ou la pointe de la flèche (souris et doigt)
    let prise = null;
    function point(e) {
      const svg = scene.querySelector('svg'), r = svg.getBoundingClientRect();
      return [(e.clientX - r.left) * geo.W / r.width, (e.clientY - r.top) * geo.H / r.height];
    }
    scene.addEventListener('pointerdown', e => {
      const p = e.target.closest && e.target.closest('[data-p]');
      if (!p) return;
      e.preventDefault();
      prise = p.dataset.p;
      scene.setPointerCapture(e.pointerId);
      scene.classList.add('glisse');
    });
    scene.addEventListener('pointermove', e => {
      if (!prise) return;
      const [px, py] = point(e), x = geo.mg + pos * geo.ppm;
      if (prise === 'B') { const AB = borne(Math.round((px - geo.mg) / geo.ppm * 10) / 10, 0, 2); if (AB !== etat.AB) changer({ AB }); return; }
      const a = aimanter(Math.atan2(geo.yG - py, px - x) * 180 / Math.PI);
      if (a !== etat.alpha) changer({ alpha: a });
    });
    const lacher = () => { prise = null; scene.classList.remove('glisse'); };
    scene.addEventListener('pointerup', lacher);
    scene.addEventListener('pointercancel', lacher);

    // le chariot part de A avec une vitesse donnée et arrive en B plus vite (W > 0), moins vite (W < 0)
    // ou à la même vitesse (W = 0) ; vitesses « visuelles », proportions respectées pour le signe de W
    function arreter() { if (anim) cancelAnimationFrame(anim.raf); anim = null; }
    function lancer() {
      const { F, AB, alpha } = etat, w = travailDe(F, AB, alpha), max = F * AB;
      arreter();
      if (AB <= 0) { $('[data-a="etat"]').textContent = 'Écarte B de A pour que le chariot se déplace.'; return; }
      const v0 = .8, vB = v0 * Math.sqrt(Math.max(.1, 1 + (max ? .9 * w / max : 0))), acc = (vB * vB - v0 * v0) / (2 * AB);
      const duree = 2 * AB / (v0 + vB);
      const fin = () => {
        pos = AB; dessiner(); anim = null;
        $('[data-a="etat"]').textContent = w > 1e-9 ? 'Le chariot a accéléré : la force lui a fourni de l\'énergie (travail moteur).'
          : w < -1e-9 ? 'Le chariot a ralenti : la force lui a retiré de l\'énergie (travail résistant).'
          : 'Le chariot garde la même vitesse : la force ne lui a ni fourni ni retiré d\'énergie (travail nul).';
      };
      if (reduit()) { fin(); return; }
      $('[data-a="etat"]').textContent = 'Le chariot roule de A vers B…';
      const t0 = performance.now();
      const pas = now => {
        const t = Math.min(duree, (now - t0) / 1000);
        pos = Math.min(AB, v0 * t + acc * t * t / 2);
        dessiner();
        if (t >= duree) fin(); else anim.raf = requestAnimationFrame(pas);
      };
      anim = { raf: requestAnimationFrame(pas) };
    }
    const bL = $('[data-a="lancer"]');
    if (bL) bL.onclick = lancer;

    // dessin à la largeur disponible
    const suivre = () => {
      const W = Math.round(scene.clientWidth);
      if (!W || W === largeur) return;
      largeur = W; geo = geometrie(W); dessiner();
    };
    if (window.ResizeObserver) new ResizeObserver(suivre).observe(scene); else addEventListener('resize', suivre);

    const api = {
      el: racine,
      etat: () => ({ F: etat.F, AB: etat.AB, alpha: etat.alpha, W: travailDe(etat.F, etat.AB, etat.alpha) }),
      regler: n => changer(n),
    };
    lire();
    suivre();
    return api;
  }

  /* ============================================================
     LE WAGON (activité, partie I) : vu de dessus, il roule sur les rails
     de A vers B ; cinq personnages le tirent avec des cordes.
     F₁ : 0° ; F₂ et F₃ : angles aigus ; F₄ : 180° ; F₅ : 90°.
     Une bulle (case) près de chaque personnage, en pourcentage du dessin.
     ============================================================ */
  const PERSOS = [
    { id: 'F1', n: '1', corde: [250, 120, 312, 120], bulle: [372, 56], et: [354, 102] },
    { id: 'F2', n: '2', corde: [246, 100, 294, 60], bulle: [232, 34], et: [332, 62] },
    { id: 'F3', n: '3', corde: [246, 140, 290, 182], bulle: [370, 210], et: [282, 236] },
    { id: 'F4', n: '4', corde: [150, 120, 88, 120], bulle: [44, 62], et: [98, 100] },
    { id: 'F5', n: '5', corde: [200, 144, 200, 184], bulle: [138, 212], et: [228, 236] },
  ];
  // bonhomme qui tire la corde : mains au bout de la corde, corps penché vers l'arrière
  function bonhomme(hx, hy, ux, uy) {
    const px = hx + ux * 12, py = hy + uy * 12;
    const cou = [px + ux * 6, py - 10], tete = [px + ux * 8, py - 21], hanche = [px - ux * 2, py + 8];
    return `<g class="ec-w-perso"><line x1="${f1(cou[0])}" y1="${f1(cou[1])}" x2="${f1(hanche[0])}" y2="${f1(hanche[1])}"/>` +
      `<line x1="${f1(hanche[0])}" y1="${f1(hanche[1])}" x2="${f1(hanche[0] - 7 - ux * 3)}" y2="${f1(hanche[1] + 15)}"/><line x1="${f1(hanche[0])}" y1="${f1(hanche[1])}" x2="${f1(hanche[0] + 7 - ux * 3)}" y2="${f1(hanche[1] + 15)}"/>` +
      `<line x1="${f1(cou[0])}" y1="${f1(cou[1] + 3)}" x2="${f1(hx)}" y2="${f1(hy)}"/><circle cx="${f1(tete[0])}" cy="${f1(tete[1])}" r="7"/></g>`;
  }
  function wagonSVG() {
    let g = '';
    // rails et traverses, A et B, sens du déplacement
    for (let x = 16; x < 392; x += 14) g += `<line x1="${x}" y1="105" x2="${x}" y2="135" class="ec-w-traverse"/>`;
    g += '<line x1="8" y1="110" x2="392" y2="110" class="ec-w-rail"/><line x1="8" y1="130" x2="392" y2="130" class="ec-w-rail"/>';
    g += '<circle cx="28" cy="120" r="5" class="ec-sc-point"/><text x="28" y="154" text-anchor="middle" class="ec-sc-pt">A</text>';
    g += '<circle cx="374" cy="120" r="5" class="ec-sc-point"/><text x="374" y="154" text-anchor="middle" class="ec-sc-pt">B</text>';
    g += trait(24, 246, 96, 246, 'ec-tr ec-tr-mvt') + '<text x="102" y="250" class="ec-sc-txt">sens du déplacement</text>';
    // queues des bulles, cordes, personnages, nom de chaque force
    PERSOS.forEach(q => {
      const [x1, y1, x2, y2] = q.corde, L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const tx = x2 + ux * 18, ty = y2 + uy * 12 - 18, dx = tx - q.bulle[0], dy = ty - q.bulle[1], d = Math.hypot(dx, dy);
      g += `<line x1="${q.bulle[0]}" y1="${q.bulle[1]}" x2="${f1(q.bulle[0] + dx * (d - 12) / d)}" y2="${f1(q.bulle[1] + dy * (d - 12) / d)}" class="ec-w-queue"/>`;
      g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ec-w-corde"/>` + bonhomme(x2, y2, ux, uy);
      g += `<text x="${q.et[0]}" y="${q.et[1]}" text-anchor="middle" class="ec-w-nom">F<tspan dy="4" font-size="11">${q.n}</tspan></text>`;
    });
    // le wagon vu de dessus (plus large que la voie)
    g += '<rect x="150" y="96" width="100" height="48" rx="5" class="ec-w-wagon"/><rect x="160" y="104" width="80" height="32" rx="3" class="ec-w-toit"/>';
    return `<svg viewBox="0 0 400 260" class="ec-wagon-svg" aria-hidden="true">${g}</svg>`;
  }
  function wagonSchema() {
    return `<div class="ec-wagon" role="group" aria-label="Wagon vu de dessus, tiré de A vers B par cinq personnages ; une bulle près de chacun">${wagonSVG()}
      ${PERSOS.map(q => `<div class="ec-bulle" style="left:${f1(q.bulle[0] / 4)}%;top:${f1(q.bulle[1] / 2.6)}%" aria-label="Bulle de F${q.n}">${window.EC.slot(q.id)}</div>`).join('')}</div>`;
  }

  /* ============================================================
     LES TRAJETS (activité, partie III) : <span class="vec-nom">F</span> constante (10 N, parallèle à AB, vers B),
     AB = 1 m ; le travail s'accumule pendant le trajet (W = F × déplacement horizontal)
     ============================================================ */
  const TRAJETS = [
    { n: 1, nom: 'droit', pts: [[0, 0], [1, 0]] },
    { n: 2, nom: 'en zigzag', pts: [[0, 0], [.25, .3], [.5, 0], [.75, .3], [1, 0]] },
    { n: 3, nom: 'monter, aller à l\'horizontale, descendre', pts: [[0, 0], [0, .5], [1, .5], [1, 0]] },
    { n: 4, nom: 'un détour', pts: [[0, 0], [-.25, 0], [-.25, -.35], [1.25, -.35], [1.25, 0], [1, 0]] },
  ];
  const FT = 10;                     // valeur de la force (N)
  function Chemins(zone, opts) {
    opts = opts || {};
    const racine = el('div', 'ec-chemins');
    racine.innerHTML = `<div class="ec-chemins-boutons">${TRAJETS.map(t => `<button type="button" class="btn-secondary" data-t="${t.n}">Trajet ${t.n}</button>`).join('')}</div>
      <div class="ec-chemins-scene"></div>
      <div class="ec-chemins-lecture" aria-live="polite"><p class="ec-simu-w">W = <b data-a="w">0 J</b></p><p class="ec-chemins-alpha" data-a="alpha">Choisis un trajet.</p></div>
      <div class="ph-defile"><table class="ph-tableau ec-chemins-tab"><thead><tr><th>Trajet</th>${TRAJETS.map(t => `<th>${t.n}</th>`).join('')}</tr></thead>
        <tbody><tr><th>W</th>${TRAJETS.map(t => `<td data-w="${t.n}">…</td>`).join('')}</tr></tbody></table></div>`;
    zone.appendChild(racine);
    const $ = s => racine.querySelector(s), scene = $('.ec-chemins-scene');
    const faits = new Set(), abonnes = [];
    let actif = 1, avance = 0, anim = null, largeur = 0, geo = null;        // avance : longueur parcourue (m)
    const longueur = t => t.pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - t.pts[i][0], p[1] - t.pts[i][1]), 0);
    // position et segment après une longueur s
    function surTrajet(t, s) {
      for (let i = 1; i < t.pts.length; i++) {
        const [x0, y0] = t.pts[i - 1], [x1, y1] = t.pts[i], L = Math.hypot(x1 - x0, y1 - y0);
        if (s <= L || i === t.pts.length - 1) { const u = Math.min(1, s / L); return { x: x0 + u * (x1 - x0), y: y0 + u * (y1 - y0), dx: x1 - x0, dy: y1 - y0 }; }
        s -= L;
      }
    }
    function geometrie(W) {
      // dessin centré : x de −0,25 m à 1,25 m (plus la flèche de F⃗), y de −0,35 m à 0,5 m
      const ppm = Math.min(220, (W - 90) / 1.5), x0 = (W - 1.5 * ppm - 60) / 2;
      return { W, ppm, H: Math.round(.85 * ppm + 70), X: x => x0 + (x + .25) * ppm, Y: y => 26 + (.5 - y) * ppm + 10 };
    }
    function dessiner() {
      if (!geo) return;
      const { W, H, X, Y } = geo, t = TRAJETS[actif - 1];
      let g = '';
      TRAJETS.forEach(u => { g += `<polyline points="${u.pts.map(p => f1(X(p[0])) + ',' + f1(Y(p[1]))).join(' ')}" class="ec-ch-trajet${u.n === actif ? ' actif' : ''}"/>`; });
      g += `<circle cx="${X(0)}" cy="${Y(0)}" r="5" class="ec-sc-point"/><text x="${X(0) - 8}" y="${Y(0) + 20}" class="ec-sc-pt">A</text>`;
      g += `<circle cx="${X(1)}" cy="${Y(0)}" r="5" class="ec-sc-point"/><text x="${X(1) + 2}" y="${Y(0) + 20}" class="ec-sc-pt">B</text>`;
      const p = surTrajet(t, avance), x = X(p.x), y = Y(p.y);
      g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="8" class="ec-ch-mobile"/>`;
      const a = fleche(x, y, 0, 52, COUL.F);
      g += a.svg + nomSVG('F', a.x2 + 16, y + 6, COUL.F);
      scene.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="ec-simu-svg" role="img" aria-label="Trajet ${actif} de A à B (${t.nom}) ; la force F de 10 N est horizontale, vers B">${g}</svg>`;
    }
    function afficher() {
      const t = TRAJETS[actif - 1], p = surTrajet(t, avance), w = FT * p.x;
      $('[data-a="w"]').textContent = fmt(Math.round(w * 10) / 10, 1).replace(/,0$/, '') + ' J';
      if (!anim && !avance) { $('[data-a="alpha"]').textContent = `Trajet ${t.n} (${t.nom}) : appuie à nouveau pour le parcourir.`; return; }
      const ang = Math.round(Math.abs(Math.atan2(p.dy, p.dx) * 180 / Math.PI));
      $('[data-a="alpha"]').innerHTML = ang === 90 ? 'α = 90° : <span class="vec-nom">F</span> est perpendiculaire au déplacement, <b>W ne change pas</b>.'
        : ang === 0 ? 'α = 0° : <span class="vec-nom">F</span> est dans le sens du déplacement, <b>W augmente</b>.'
        : ang === 180 ? 'α = 180° : <span class="vec-nom">F</span> est opposée au déplacement, <b>W diminue</b>.'
        : `α ≈ ${ang}° : ${ang < 90 ? '<b>W augmente</b>, moins vite qu\'à 0°' : '<b>W diminue</b>'}.`;
    }
    function finir() {
      const t = TRAJETS[actif - 1];
      anim = null; avance = longueur(t);
      dessiner(); afficher();
      faits.add(t.n);
      $(`[data-w="${t.n}"]`).textContent = fmt(FT * 1) + ' J';
      racine.querySelector(`[data-t="${t.n}"]`).classList.add('fait');
      $('[data-a="alpha"]').innerHTML = `Trajet ${t.n} terminé : <b>W = ${fmt(FT)} J</b>.`;
      if (opts.onTrajet) opts.onTrajet(t.n, FT);
      abonnes.forEach(f => f(faits));
    }
    function parcourir(n) {
      if (anim) cancelAnimationFrame(anim.raf);
      actif = n; avance = 0;
      racine.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.t === n)));
      const t = TRAJETS[n - 1], L = longueur(t), v = .55;
      if (reduit()) { finir(); return; }
      const t0 = performance.now();
      anim = {};
      const pas = now => {
        avance = Math.min(L, (now - t0) / 1000 * v);
        dessiner(); afficher();
        if (avance >= L) finir(); else anim.raf = requestAnimationFrame(pas);
      };
      anim.raf = requestAnimationFrame(pas);
    }
    racine.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => parcourir(+b.dataset.t); });
    const suivre = () => {
      const W = Math.round(scene.clientWidth);
      if (!W || W === largeur) return;
      largeur = W; geo = geometrie(W); dessiner();
    };
    if (window.ResizeObserver) new ResizeObserver(suivre).observe(scene); else addEventListener('resize', suivre);
    suivre();
    return { faits, surFait(f) { abonnes.push(f); }, el: racine };
  }

  /* ============================================================
     TABLEAU « W LU SUR LE SIMULATEUR » (question 7 de l'activité)
     Chaque case est vérifiée à 0,1 J près ; diagnostic de la première case fausse.
     ============================================================ */
  const deg = a => String(a).replace('-', '−') + '°';
  function partieTableauW(o) {
    return { type: 'perso', q: o.q, solution: o.solution,
      monter(zone, api) {
        const d = el('div', 'ph-defile');
        d.innerHTML = `<table class="ec-tab-w"><thead><tr><th>F</th><th>α</th><th>AB</th><th>W lu (J)</th></tr></thead><tbody>${o.lignes.map(([F, a, AB], i) =>
          `<tr><td>${F} N</td><td>${deg(a)}</td><td>${fmt(AB, 1)} m</td><td data-i="${i}"></td></tr>`).join('')}</tbody></table>`;
        zone.appendChild(d);
        const att = o.lignes.map(([F, a, AB]) => travailDe(F, AB, a));
        const champs = o.lignes.map(([F, a, AB], i) => {
          const c = champ({ petit: true, aria: `Travail W pour F = ${F} N, α = ${a}°, AB = ${AB} m` });
          const td = d.querySelector(`[data-i="${i}"]`);
          td.appendChild(c.el);
          c.input.addEventListener('input', () => { td.classList.remove('ok', 'ko'); api.effacer(); });
          c.input.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const vide = champs.find(x => x.input.value.trim() === '');
            if (vide) vide.input.focus(); else valider();
          });
          return c;
        });
        const bVal = boutonValider(zone);
        function diag(i, v) {
          const [F, a, AB] = o.lignes[i], w = att[i];
          const ligne = `F = ${F} N, α = ${deg(a)}, AB = ${fmt(AB, 1)} m`;
          if (w < 0 && Math.abs(v + w) <= .1) return `Ligne ${ligne} : la force tire vers l'arrière, le simulateur affiche un travail <b>négatif</b> (bouton ± pour le signe −).`;
          if (Math.abs(w) > 1e-9 && Math.abs(v - F * AB) <= .1 && Math.abs(w - F * AB) > .1) return `Ligne ${ligne} : règle bien α = ${deg(a)} sur le simulateur ; W n'est plus égal à F × AB.`;
          if (w === 0) return `Ligne ${ligne} : règle α = ${deg(a)} et regarde la jauge : la force ne fournit aucune énergie.`;
          return `Ligne ${ligne} : règle le simulateur exactement sur ces valeurs, puis lis W sous le dessin.`;
        }
        function valider() {
          if (api.fini()) return;
          const vs = champs.map(c => lire(c.input.value));
          if (vs.some(isNaN)) { secouer(d); api.message('Complète toutes les cases du tableau (avec un nombre).'); return; }
          const ok = vs.map((v, i) => Math.abs(v - att[i]) <= .1 + 1e-9);
          champs.forEach((c, i) => { const td = c.el.parentElement; td.classList.toggle('ok', ok[i]); td.classList.toggle('ko', !ok[i]); });
          if (ok.every(Boolean)) { champs.forEach(c => c.desactiver(true)); bVal.fermer(); api.reussi(); return; }
          const i = ok.indexOf(false);
          api.erreur(`${ok.filter(x => !x).length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'} ${diag(i, vs[i])}`);
          secouer(d);
        }
        bVal.onclick = valider;
        return {
          montrer() {
            champs.forEach((c, i) => { c.input.value = ecrireW(att[i]).replace(' J', ''); c.desactiver(true); c.el.parentElement.classList.remove('ko'); c.el.parentElement.classList.add('ok'); });
            bVal.fermer();
          },
        };
      } };
  }

  Object.assign(window.EC, { partieTableauW, Simu, wagonSchema, Chemins, TRAJETS, travailDe, cosd, ecrireW, nature, aimanter, CAS });
})();
