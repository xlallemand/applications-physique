/* ============================================================
   Cadre commun des deux pages sur un écran de l'application
   « Forces et mouvement : lois de Newton » (animation du principe
   d'inertie, atelier somme des forces et accélération), sur le modèle
   de atome-ions/ (cadreSim, defis) et de l'atelier de bilan-forces/.

   LN.cadre(zone, cfg) → { $, zone, onglet, message, fig }
     cfg = { badge, titre, bande (HTML au-dessus de la figure), bas (HTML sous la figure),
             onglets: [{ id, nom, sections: [ids], tel (true : onglet du téléphone seulement),
                         ordi (true : onglet de l'ordinateur seulement) }],
             sections: [{ id, html }] }
     Ordinateur : figure à gauche, panneau à onglets à droite (≈ 320 px).
     Téléphone (< 900 px) : figure en haut, panneau à onglets dessous, dans l'écran.
   LN.defis(zone, liste, opts) → { verifier(etat), faits, tousFaits() }
     liste = [{ t (texte), ok(etat), preparer() }] ; cochés tout seuls, dans n'importe quel ordre ;
     opts.surReussite([i]) (rangs des défis réussis à l'instant), opts.bilan (HTML affiché quand tout est réussi).
   LN.grilleForces(zone, o) → { forces, sel, dessiner(), choisir(i) }
     petit quadrillage où l'on règle des forces depuis le point G : glisser la pointe
     (souris, doigt), boutons fléchés, touches fléchées ; o = { forces: [{ nom, coord, coul }],
     etendue, somme (true : Σ F⃗ dessinée en noir), onChange(), aria }
   ============================================================ */
(function () {
  'use strict';
  const LN = window.LN;
  const MOINS = '−';

  /* ---------- Cadre ---------- */
  function cadre(zone, cfg) {
    zone.innerHTML = `<div class="ln-sim">
      <div class="er-card ln-sim-tete">
        <div class="ln-sim-titre"><span class="er-badge">${cfg.badge}</span><h2 class="er-titre">${cfg.titre}</h2></div>
        <span data-plein></span>
      </div>
      <div class="ln-sim-corps">
        <div class="er-card ln-sim-scene">
          ${cfg.bande ? `<div class="ln-sim-bande">${cfg.bande}</div>` : ''}
          <div class="ln-sim-fig" data-a="fig"></div>
          ${cfg.bas ? `<div class="ln-sim-bas">${cfg.bas}</div>` : ''}
          <div class="ln-sim-msg" data-a="msg" aria-live="polite"></div>
        </div>
        <aside class="er-card ln-sim-panneau" aria-label="Réglages">
          <div class="ln-sim-onglets" role="tablist">${cfg.onglets.map(o => `<button type="button" role="tab" data-o="${o.id}" aria-selected="false"${o.tel ? ' data-tel' : ''}${o.ordi ? ' data-ordi' : ''}>${o.nom}</button>`).join('')}</div>
          <div class="ln-sim-blocs">${cfg.sections.map(s => `<section class="ln-sim-bloc" data-s="${s.id}">${s.html}</section>`).join('')}</div>
        </aside>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    const mq = matchMedia('(max-width: 899px)');
    let courant = cfg.onglets[0].id;
    // un onglet montre une ou plusieurs sections ; sur ordinateur, un onglet « tel » est fondu dans le précédent
    function onglet(id) {
      const tel = mq.matches;
      let o = cfg.onglets.find(x => x.id === id) || cfg.onglets[0];
      if (!tel && o.tel) o = cfg.onglets[Math.max(0, cfg.onglets.indexOf(o) - 1)];
      if (tel && o.ordi) o = cfg.onglets.find(x => x.tel) || o;
      courant = o.id;
      const secs = tel ? o.sections : (o.sectionsOrdi || o.sections);
      zone.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-selected', b.dataset.o === o.id ? 'true' : 'false'));
      zone.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('actif', secs.indexOf(s.dataset.s) !== -1));
      if (cfg.surOnglet) cfg.surOnglet(o.id);
    }
    zone.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => onglet(b.dataset.o); });
    const placer = () => {
      onglet(courant);
      // bouton plein écran : dans l'en-tête sur ordinateur, au bout des onglets sur téléphone (l'en-tête y est caché)
      const pe = zone.querySelector('.pe-bouton');
      if (pe) (mq.matches ? zone.querySelector('.ln-sim-onglets') : zone.querySelector('.ln-sim-tete')).appendChild(pe);
    };
    setTimeout(placer, 0);
    if (mq.addEventListener) mq.addEventListener('change', placer); else mq.addListener(placer);
    onglet(courant);
    function message(h, type) {
      const m = $('msg');
      if (!h) { m.innerHTML = ''; return; }
      const cls = type === 'refus' ? 'callout-danger' : type === 'ok' ? 'callout-success' : 'callout-accent';
      m.innerHTML = `<div class="${cls} ln-sim-msg-in">${h}</div>`;
    }
    return { $, zone, onglet, message, fig: $('fig'), tel: () => mq.matches };
  }

  /* ---------- Défis « À essayer » ---------- */
  function defis(zone, liste, opts) {
    opts = opts || {};
    zone.innerHTML = `<div class="ln-defis-puces" role="tablist" aria-label="Défis">${liste.map((d, i) => `<button type="button" role="tab" class="ln-puce" data-p="${i}" aria-selected="false" aria-label="Défi ${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="ln-defi-t" data-a="defiTexte"></div><div class="ln-defis-bilan" data-a="bilanDefis" aria-live="polite"></div>`;
    const faits = liste.map(() => false), puces = Array.from(zone.querySelectorAll('.ln-puce'));
    let choisi = 0, marque = false;
    function choisir(i) {
      choisi = i;
      puces.forEach((p, k) => p.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      const d = liste[i];
      zone.querySelector('[data-a="defiTexte"]').innerHTML = `<p>${faits[i] ? '<b class="ln-ok">✓ Réussi :</b> ' : ''}${d.t}</p>${!faits[i] && d.preparer ? '<button type="button" class="btn-small ln-essayer" data-go>Essayer</button>' : ''}`;
      const go = zone.querySelector('[data-go]');
      if (go) go.onclick = () => d.preparer();
    }
    puces.forEach((p, i) => { p.onclick = () => choisir(i); });
    choisir(0);
    function verifier(etat) {
      const nouveaux = [];
      liste.forEach((d, i) => {
        if (!faits[i] && d.ok(etat)) { faits[i] = true; nouveaux.push(i); }
        puces[i].classList.toggle('fait', faits[i]);
        puces[i].setAttribute('aria-label', `Défi ${i + 1}${faits[i] ? ', réussi' : ''}`);
      });
      // des défis réussis (parfois plusieurs à la fois) : le suivant pas encore fait est montré
      if (nouveaux.length) {
        const der = nouveaux[nouveaux.length - 1], suivant = faits.findIndex((f, i) => !f && i > der);
        choisir(suivant >= 0 ? suivant : faits.indexOf(false) >= 0 ? faits.indexOf(false) : der);
        if (opts.surReussite) opts.surReussite(nouveaux);
      } else choisir(choisi);
      if (faits.every(Boolean)) {
        zone.querySelector('[data-a="bilanDefis"]').innerHTML = opts.bilan ? `<div class="callout-success ln-sim-msg-in">${opts.bilan}</div>` : '';
        if (!marque) { marque = true; window.SOM.marquer({ fait: true }); }
      }
    }
    return { verifier, faits, tousFaits: () => faits.every(Boolean) };
  }

  /* ---------- Petit quadrillage de forces ---------- */
  function grilleForces(zone, o) {
    o = Object.assign({ etendue: 4 }, o);
    const E = o.etendue, forces = o.forces;
    zone.innerHTML = `<div class="ln-gf">
      <div class="ln-gf-chips" role="group" aria-label="Force à régler">${forces.map((f, i) => `<button type="button" class="ln-gf-chip" data-i="${i}" style="--c:${f.coul}" aria-pressed="false">${LN.V(f.nom[0], f.nom.slice(1))}</button>`).join('')}
        <button type="button" class="btn-small ln-gf-zero" data-a="zero">Effacer</button></div>
      <div class="ln-gf-corps">
        <svg class="ln-gf-svg" tabindex="0" role="img" aria-label="${o.aria || 'Quadrillage des forces : glisse la pointe de la force choisie'}"></svg>
        <div class="ln-gf-pad" role="group" aria-label="Déplacer la pointe d'un carreau">
          <button type="button" data-d="0,1" aria-label="Pointe un carreau vers le haut">↑</button>
          <button type="button" data-d="-1,0" aria-label="Pointe un carreau vers la gauche">←</button>
          <button type="button" data-d="1,0" aria-label="Pointe un carreau vers la droite">→</button>
          <button type="button" data-d="0,-1" aria-label="Pointe un carreau vers le bas">↓</button>
        </div>
      </div>
      <p class="ln-gf-val" data-a="val" aria-live="polite"></p></div>`;
    const svg = zone.querySelector('svg'), chips = Array.from(zone.querySelectorAll('.ln-gf-chip'));
    const N = 2 * E, T = 160, u = T / (N + .6), m = u * .3;
    svg.setAttribute('viewBox', `0 0 ${T} ${T}`);
    const px = x => m + (x + E) * u, py = y => m + (E - y) * u;
    const api = { forces, sel: 0 };
    function dessiner() {
      let s = `<rect width="${T}" height="${T}" fill="#fff"/>`;
      for (let k = -E; k <= E; k++) s += `<line x1="${px(k)}" y1="${py(-E)}" x2="${px(k)}" y2="${py(E)}" stroke="#dcd7e8" stroke-width="1"/><line x1="${px(-E)}" y1="${py(k)}" x2="${px(E)}" y2="${py(k)}" stroke="#dcd7e8" stroke-width="1"/>`;
      if (o.somme) {
        const S = somme();
        if (S[0] || S[1]) s += LN.fl(px(0), py(0), px(S[0]), py(S[1]), LN.ENCRE, { ep: 3.2, tirets: true, lt: 10 });
      }
      forces.forEach((f, i) => {
        if (f.coord[0] || f.coord[1]) s += LN.fl(px(0), py(0), px(f.coord[0]), py(f.coord[1]), f.coul, { ep: i === api.sel ? 3 : 2.2, lt: 9 });
      });
      const f = forces[api.sel];
      s += `<circle cx="${px(f.coord[0])}" cy="${py(f.coord[1])}" r="${u * .32}" fill="none" stroke="${f.coul}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      s += `<circle cx="${px(0)}" cy="${py(0)}" r="3" fill="${LN.ENCRE}"/>`;
      svg.innerHTML = s;
      chips.forEach((c, i) => { c.setAttribute('aria-pressed', i === api.sel ? 'true' : 'false'); c.classList.toggle('nulle', !forces[i].coord[0] && !forces[i].coord[1]); });
      const S = somme();
      zone.querySelector('[data-a="val"]').innerHTML = `${LN.V(f.nom[0], f.nom.slice(1))} : ${coordTxt(f.coord)} · ${LN.SF} : ${coordTxt(S)}`;
    }
    const coordTxt = c => (!c[0] && !c[1] ? 'nulle' : `(${String(c[0]).replace('-', MOINS)} ; ${String(c[1]).replace('-', MOINS)}) carreaux`);
    function somme() { return forces.reduce((s, f) => [s[0] + f.coord[0], s[1] + f.coord[1]], [0, 0]); }
    function poser(c) {
      const f = forces[api.sel];
      c = [Math.max(-E, Math.min(E, c[0])), Math.max(-E, Math.min(E, c[1]))];
      if (c[0] === f.coord[0] && c[1] === f.coord[1]) return;
      f.coord = c;
      dessiner();
      if (o.onChange) o.onChange();
    }
    chips.forEach((c, i) => { c.onclick = () => { api.sel = i; dessiner(); }; });
    zone.querySelector('[data-a="zero"]').onclick = () => poser([0, 0]);
    zone.querySelectorAll('[data-d]').forEach(b => {
      b.onclick = () => { const [dx, dy] = b.dataset.d.split(',').map(Number), f = forces[api.sel]; poser([f.coord[0] + dx, f.coord[1] + dy]); };
    });
    svg.addEventListener('keydown', e => {
      const d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (!d) return;
      e.preventDefault();
      const f = forces[api.sel];
      poser([f.coord[0] + d[0], f.coord[1] + d[1]]);
    });
    // glisser la pointe (souris, doigt) : on prend la force la plus proche du point touché
    let drag = null;
    const versGrille = e => {
      const r = svg.getBoundingClientRect(), k = T / r.width;
      return [Math.round(((e.clientX - r.left) * k - m) / u - E), Math.round(E - ((e.clientY - r.top) * k - m) / u)];
    };
    svg.addEventListener('pointerdown', e => {
      const c = versGrille(e);
      // pointe d'une autre force sous le doigt : elle devient la force choisie
      const i = forces.findIndex(f => (f.coord[0] || f.coord[1]) && Math.abs(f.coord[0] - c[0]) <= .5 && Math.abs(f.coord[1] - c[1]) <= .5);
      if (i >= 0) api.sel = i;
      drag = e.pointerId;
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* rien */ }
      poser(c);
      dessiner();
      e.preventDefault();
    });
    svg.addEventListener('pointermove', e => { if (drag === e.pointerId) poser(versGrille(e)); });
    const fin = e => { if (drag === e.pointerId) drag = null; };
    svg.addEventListener('pointerup', fin);
    svg.addEventListener('pointercancel', fin);
    api.dessiner = dessiner;
    api.somme = somme;
    api.choisir = i => { api.sel = i; dessiner(); };
    dessiner();
    return api;
  }

  Object.assign(LN, { cadre, defis, grilleForces });
})();
