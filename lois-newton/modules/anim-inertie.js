/* ============================================================
   Animation « le principe d'inertie » (module 3, page sur un écran)

   LN.animInertie(zone) : une chronophotographie (positions à intervalles
   de temps égaux, Δt = 0,5 s) produite en direct par la somme des forces
   que l'élève règle (jusqu'à trois forces, dans un petit quadrillage :
   glisser la pointe, boutons fléchés, touches fléchées) et par la vitesse
   initiale v₀ (vers la droite). Vu de dessus : le poids et la réaction du
   sol se compensent (verticaux, non dessinés).
   Objets : palet sur la glace, voiture sur un parking, skieur sur un
   plateau enneigé (référentiel terrestre, supposé galiléen) ; passager
   debout dans un bus qui freine, vu dans le référentiel du bus (non
   galiléen : le bus ralentit de 0,5 m·s⁻² par rapport au sol).
   Chaque objet : 1 carreau de force donne 0,5 m·s⁻² (a = Σ F / m).
   Le mouvement obtenu est décrit en deux mots (immobile, rectiligne
   uniforme, rectiligne accéléré, rectiligne ralenti, curviligne).

   Défis « À essayer » (dans n'importe quel ordre, cochés tout seuls) :
   MRU avec deux forces, ralentissement, trajectoire courbe, puis chacune
   des six phrases du cours (cochée quand la situation observée la
   réalise : au moins trois positions affichées).
   Lecture / Pause, Pas à pas, ↺ Recommencer, vitesse × 0,5, × 1, × 2 ;
   prefers-reduced-motion : pas d'animation automatique (pas à pas).
   Page marquée faite quand tous les défis sont réussis, ou à
   l'ouverture de l'onglet « Bilan ».
   ============================================================ */
(function () {
  'use strict';
  const LN = window.LN;
  const { V, SF, NUL, fl, PHRASES, COURTES } = LN;
  const MOINS = '−', DT = .5, NMAX = 15, K = .5, A_BUS = .5;      // Δt (s), positions au plus, m·s⁻² par carreau, freinage du bus
  const W = 24, H = 12, X0 = 3, Y0 = 6;                            // monde (m), position de départ
  const fmt = v => window.BF.fmt(v);
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const OBJETS = {
    palet: { nom: 'Palet', lib: 'Palet sur la glace', m: '0,50 kg', unite: '0,25 N', ref: 'terrestre (galiléen)', galileen: true },
    voiture: { nom: 'Voiture', lib: 'Voiture sur un parking', m: '1 000 kg', unite: '500 N', ref: 'terrestre (galiléen)', galileen: true },
    skieur: { nom: 'Skieur', lib: 'Skieur sur un plateau enneigé', m: '80 kg', unite: '40 N', ref: 'terrestre (galiléen)', galileen: true },
    passager: { nom: 'Passager', lib: 'Passager debout dans un bus qui freine', m: '70 kg', unite: '35 N', ref: 'du bus qui freine (non galiléen)', galileen: false },
  };
  const COULS = ['#c2255c', '#1971c2', '#5c940d'];

  function animInertie(zone) {
    const c = LN.cadre(zone, {
      badge: 'MODULE 3 · ANIMATION', titre: 'Le principe d\'inertie',
      bande: '<p class="ln-sim-info" data-a="info"></p>',
      bas: `<div class="ln-anim-ctrl">
          <button type="button" class="btn-primary ln-lire" data-a="lire">▶ Lecture</button>
          <button type="button" class="btn-secondary" data-a="pas">Pas à pas</button>
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <span class="ln-seg" role="group" aria-label="Vitesse de l'animation">${['0.5', '1', '2'].map(v => `<button type="button" data-v="${v}" aria-pressed="${v === '1'}">× ${v.replace('.', ',')}</button>`).join('')}</span>
        </div>
        <p class="ln-anim-mvt" data-a="mvt" aria-live="polite"></p>`,
      onglets: [{ id: 'reglages', nom: 'Réglages', sections: ['objet'], sectionsOrdi: ['objet', 'forces'] }, { id: 'forces', nom: 'Forces', sections: ['forces'], tel: true },
        { id: 'defis', nom: 'Défis', sections: ['defis'] }, { id: 'bilan', nom: 'Bilan', sections: ['bilan'] }],
      sections: [
        { id: 'objet', html: `<p class="ln-lab">Système</p>
            <div class="ln-seg ln-objets" role="group" aria-label="Système étudié">${Object.keys(OBJETS).map(k => `<button type="button" data-obj="${k}" aria-pressed="false">${OBJETS[k].nom}</button>`).join('')}</div>
            <div class="ln-ligne"><span class="ln-lab">Vitesse initiale v<sub>0</sub> (vers la droite)</span>
              <span class="ln-pm"><button type="button" class="btn-secondary" data-v0="-1" aria-label="Diminuer la vitesse initiale">${MOINS}</button><b data-a="v0"></b><button type="button" class="btn-secondary" data-v0="1" aria-label="Augmenter la vitesse initiale">+</button></span></div>` },
        { id: 'forces', html: '<p class="ln-lab">Forces (<span data-a="unite"></span>)</p><div data-a="grille"></div>' },
        { id: 'defis', html: '<div data-a="defis"></div>' },
        { id: 'bilan', html: `<div class="ln-bilan"><div class="cle"><p><b>Principe d'inertie</b> : dans un référentiel galiléen, ${SF} = ${NUL} ⟺ le système est immobile ou en mouvement rectiligne uniforme.</p>
            <p>Si ${SF} ≠ ${NUL}, la vitesse change : sa valeur (accéléré, ralenti) ou sa direction (courbe).</p></div>
            <ol class="ln-phrases ln-phrases-courtes">${COURTES.map(t => `<li>${t}</li>`).join('')}</ol></div>` },
      ],
      surOnglet: id => { if (id === 'bilan') window.SOM.marquer({ fait: true }); },
    });
    const $ = c.$;

    /* ---------- État ---------- */
    const etat = { obj: 'palet', v0: 2, t: 0, joue: false, vitesse: 1 };
    const forces = [{ nom: 'F1', coord: [0, 0], coul: COULS[0] }, { nom: 'F2', coord: [0, 0], coul: COULS[1] }, { nom: 'F3', coord: [0, 0], coul: COULS[2] }];
    const grille = LN.grilleForces($('grille'), { forces, somme: true, onChange: changer, aria: 'Quadrillage des forces : glisse la pointe de la force choisie, depuis le point G' });

    // accélération apparente (dans le référentiel de l'étude), en m·s⁻²
    const S = () => grille.somme();
    const acc = () => { const s = S(); return [K * s[0] + (OBJETS[etat.obj].galileen ? 0 : A_BUS), K * s[1]]; };
    const pos = t => { const a = acc(); return [X0 + etat.v0 * t + a[0] * t * t / 2, Y0 + a[1] * t * t / 2]; };
    const dedans = p => p[0] >= -.5 && p[0] <= W + .5 && p[1] >= -.5 && p[1] <= H + .5;
    // nombre de positions affichées à la date t (la dernière dans le cadre)
    function nbImages(t) {
      let n = 0;
      for (let k = 0; k * DT <= t + 1e-9 && k < NMAX; k++) { if (!dedans(pos(k * DT))) break; n++; }
      return n;
    }
    // mouvement en deux mots (dans le référentiel de l'étude)
    function mouvement() {
      const a = acc(), na = Math.hypot(a[0], a[1]);
      if (na < 1e-9) return etat.v0 ? 'rectiligne uniforme' : 'immobile';
      if (!etat.v0 || Math.abs(a[1]) < 1e-9) {
        if (!etat.v0 || a[0] > 0) return 'rectiligne accéléré';
        return 'rectiligne ralenti';
      }
      return 'curviligne';
    }

    /* ---------- Dessin ---------- */
    let geo = null;
    function mesurer() {
      const r = c.fig.getBoundingClientRect(), Wp = Math.max(200, r.width), Hp = Math.max(120, r.height);
      const s = Math.min((Wp - 16) / W, (Hp - 16) / H);
      geo = { Wp, Hp, s, ox: (Wp - W * s) / 2, oy: (Hp - H * s) / 2 };
    }
    const X = x => geo.ox + x * geo.s, Y = y => geo.oy + (H - y) * geo.s;
    function fond() {
      const o = etat.obj, x1 = X(0), y1 = Y(H), w = W * geo.s, h = H * geo.s;
      let s = `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" rx="10" fill="${o === 'palet' ? '#eef5fb' : o === 'skieur' ? '#f7f8fa' : o === 'voiture' ? '#f1f0ec' : '#f6f3ec'}" stroke="#dfdbd2"/>`;
      if (o === 'voiture') for (let k = 1; k < 8; k++) s += `<line x1="${X(k * 3)}" y1="${Y(H)}" x2="${X(k * 3)}" y2="${Y(H - 2)}" stroke="#c9c5bb" stroke-width="2"/><line x1="${X(k * 3)}" y1="${Y(0)}" x2="${X(k * 3)}" y2="${Y(2)}" stroke="#c9c5bb" stroke-width="2"/>`;
      if (o === 'palet') s += `<circle cx="${X(W / 2)}" cy="${Y(H / 2)}" r="${2.4 * geo.s}" fill="none" stroke="#c7d8ea" stroke-width="2"/><line x1="${X(W / 2)}" y1="${Y(0)}" x2="${X(W / 2)}" y2="${Y(H)}" stroke="#c7d8ea" stroke-width="2"/>`;
      if (o === 'skieur') for (let k = 0; k < 14; k++) s += `<circle cx="${X((k * 7.3) % W)}" cy="${Y((k * 4.1) % H)}" r="2" fill="#dfe3ea"/>`;
      if (o === 'passager') {
        // couloir du bus vu de dessus, sièges sur les côtés ; le bus avance vers la droite et freine
        for (let k = 0; k < 8; k++) s += `<rect x="${X(1 + k * 3)}" y="${Y(H - .3)}" width="${2 * geo.s}" height="${1.8 * geo.s}" rx="4" fill="#e4dfd3"/><rect x="${X(1 + k * 3)}" y="${Y(2.1)}" width="${2 * geo.s}" height="${1.8 * geo.s}" rx="4" fill="#e4dfd3"/>`;
        s += fl(X(W - 7), Y(H - 2.9), X(W - 1.5), Y(H - 2.9), '#8d8f94', { ep: 1.6, lt: 8 }) + LN.txt(X(W - 7), Y(H - 2.9) - 6, 'le bus avance et freine', { t: 11 });
      }
      return s;
    }
    function objet(p, ang) {
      const o = etat.obj, x = X(p[0]), y = Y(p[1]), r = Math.max(7, .55 * geo.s);
      const tr = `transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(-ang).toFixed(1)})"`;
      if (o === 'palet') return `<circle cx="${x}" cy="${y}" r="${r}" fill="#16181d" opacity=".85"/>`;
      if (o === 'voiture') return `<g ${tr}><rect x="${-r * 2}" y="${-r}" width="${r * 4}" height="${r * 2}" rx="${r * .5}" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><rect x="${r * .4}" y="${-r * .75}" width="${r * .9}" height="${r * 1.5}" rx="3" fill="#cfc6f0"/></g>`;
      if (o === 'skieur') return `<g ${tr}><line x1="${-r * 1.8}" y1="${-r * .45}" x2="${r * 1.8}" y2="${-r * .45}" stroke="#5a3fc4" stroke-width="3" stroke-linecap="round"/><line x1="${-r * 1.8}" y1="${r * .45}" x2="${r * 1.8}" y2="${r * .45}" stroke="#5a3fc4" stroke-width="3" stroke-linecap="round"/><circle r="${r * .7}" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/></g>`;
      return `<g><ellipse cx="${x}" cy="${y}" rx="${r * .8}" ry="${r * 1.25}" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r * .55}" fill="#fff" stroke="#5a3fc4" stroke-width="2"/></g>`;
    }
    function dessiner() {
      if (!geo) mesurer();
      const n = nbImages(etat.t), lf = Math.max(10, .6 * geo.s);
      let s = fond();
      // chronophotographie : positions aux dates 0, Δt, 2Δt…
      for (let k = 0; k < n; k++) { const p = pos(k * DT); s += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="4" fill="${k === 0 ? '#5a3fc4' : '#16181d'}"/>`; }
      // le système à la date t (arrêté à la dernière position dans le cadre)
      const tFin = Math.min(etat.t, n ? (n - 1) * DT + DT * .999 : 0);
      let p = pos(tFin);
      if (!dedans(p)) p = pos((n - 1) * DT);
      const a = acc(), vx = etat.v0 + a[0] * tFin, vy = a[1] * tFin, ang = Math.hypot(vx, vy) > 1e-6 ? Math.atan2(vy, vx) * 180 / Math.PI : 0;
      s += objet(p, ang);
      // forces appliquées (depuis le système), puis leur somme en noir
      forces.forEach(f => { if (f.coord[0] || f.coord[1]) s += fl(X(p[0]), Y(p[1]), X(p[0]) + f.coord[0] * lf, Y(p[1]) - f.coord[1] * lf, f.coul, { ep: 2.4, lt: 9 }); });
      const So = S();
      if (So[0] || So[1]) {
        s += fl(X(p[0]), Y(p[1]), X(p[0]) + So[0] * lf, Y(p[1]) - So[1] * lf, LN.ENCRE, { ep: 3.4, tirets: true, lt: 10 });
        s += LN.nom(X(p[0]) + So[0] * lf + (So[0] >= 0 ? 16 : -16), Y(p[1]) - So[1] * lf + (So[1] > 0 ? -6 : 18), 'ΣF', '', LN.ENCRE, { t: 13 });
      }
      s += LN.txt(X(.4), Y(.5), 'Vu de dessus · Δt = 0,5 s entre deux positions', { t: 11 });
      c.fig.innerHTML = `<svg viewBox="0 0 ${geo.Wp} ${geo.Hp}" class="ln-sim-svg" role="img" aria-label="Chronophotographie du système vu de dessus, forces et somme des forces">${s}</svg>`;
      // mouvement en deux mots, une fois quelques positions affichées
      const vu = n >= 3;
      $('mvt').innerHTML = vu ? `Mouvement observé : <b>${mouvement()}</b>${mouvement() === 'rectiligne ralenti' ? ' (puis il repart en sens inverse)' : ''} · ${SF} ${So[0] || So[1] ? '≠' : '='} ${NUL}`
        : `${etat.joue ? 'Mouvement en cours…' : 'Lance l\'animation pour voir le mouvement'} · ${SF} ${So[0] || So[1] ? '≠' : '='} ${NUL}`;
      if (vu) d.verifier(constat());
    }
    // ce que l'on observe (pour les défis)
    function constat() {
      const So = S(), nulle = !So[0] && !So[1], mv = mouvement(), mru = mv === 'immobile' || mv === 'rectiligne uniforme';
      return { gal: OBJETS[etat.obj].galileen, nulle, mv, mru, v0: etat.v0, n2: forces.filter(f => f.coord[0] || f.coord[1]).length, S: So };
    }

    /* ---------- Réglages ---------- */
    function majReglages() {
      const o = OBJETS[etat.obj];
      zone.querySelectorAll('[data-obj]').forEach(b => b.setAttribute('aria-pressed', b.dataset.obj === etat.obj ? 'true' : 'false'));
      $('v0').textContent = `${fmt(etat.v0)} m·s⁻¹`;
      $('unite').textContent = `1 carreau = ${o.unite}`;
      $('info').innerHTML = `<b>${o.lib}</b> · m = ${o.m} · référentiel ${o.ref} · ${o.galileen ? 'le poids et la réaction du sol se compensent (verticaux, non dessinés)' : `le bus ralentit de 0,5 m·s<sup>${MOINS}2</sup> par rapport au sol`}`;
    }
    // un réglage change : l'animation repart du début (elle continue si elle était lancée)
    function changer() { etat.t = 0; majReglages(); dessiner(); }
    zone.querySelectorAll('[data-obj]').forEach(b => { b.onclick = () => { etat.obj = b.dataset.obj; changer(); }; });
    zone.querySelectorAll('[data-v0]').forEach(b => { b.onclick = () => { etat.v0 = Math.max(0, Math.min(4, etat.v0 + +b.dataset.v0)); changer(); }; });

    /* ---------- Animation ---------- */
    let dernier = 0;
    // nombre de positions dans le cadre pour toute la durée de l'animation
    const nTot = () => Math.max(1, nbImages((NMAX - 1) * DT));
    function boucle(ts) {
      if (!etat.joue) return;
      if (dernier) etat.t += (ts - dernier) / 1000 * etat.vitesse;
      dernier = ts;
      // fin : dernière position dans le cadre atteinte
      if (etat.t >= (nTot() - 1) * DT + .3) { etat.t = (nTot() - 1) * DT; pause(); }
      dessiner();
      if (etat.joue) requestAnimationFrame(boucle);
    }
    function lire() {
      if (reduit()) { pas(); return; }
      if (etat.t >= (nTot() - 1) * DT) etat.t = 0;
      etat.joue = true; dernier = 0;
      $('lire').textContent = '❚❚ Pause';
      requestAnimationFrame(boucle);
    }
    function pause() { etat.joue = false; $('lire').textContent = '▶ Lecture'; }
    // une position de plus (et retour au début après la dernière)
    function pas() {
      pause();
      const n = nbImages(etat.t);
      etat.t = n >= nTot() ? 0 : n * DT;
      dessiner();
    }
    $('lire').onclick = () => (etat.joue ? pause() : lire());
    $('pas').onclick = pas;
    $('re').onclick = () => { etat.t = 0; dessiner(); if (!reduit()) lire(); };
    zone.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => { etat.vitesse = +b.dataset.v; zone.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); }; });

    /* ---------- Défis ---------- */
    const regler = (obj, v0, fs) => {
      etat.obj = obj; etat.v0 = v0;
      forces.forEach((f, i) => { f.coord = (fs[i] || [0, 0]).slice(); });
      grille.choisir(fs.length && fs.length < 3 ? fs.length : 0);
      changer();
      c.onglet('forces');
      c.message('Situation préparée : règle les forces (onglet Forces), puis lance l\'animation.', 'info');
    };
    const ph = (k, t) => ({ t: `<b>Phrase ${k}.</b> Réalise une situation qui illustre : « ${PHRASES[k - 1]} »${t ? ` <span class="ln-petit">${t}</span>` : ''}` });
    const liste = [
      { t: 'Obtiens un <b>mouvement rectiligne uniforme</b> avec <b>deux forces</b> (vitesse initiale non nulle).', ok: e => e.gal && e.v0 > 0 && e.n2 === 2 && e.nulle, preparer: () => regler('palet', 2, [[3, 0]]) },
      { t: 'Obtiens un <b>ralentissement</b> en ligne droite.', ok: e => e.gal && e.mv === 'rectiligne ralenti', preparer: () => regler('voiture', 3, []) },
      { t: 'Obtiens une <b>trajectoire courbe</b>.', ok: e => e.gal && e.mv === 'curviligne', preparer: () => regler('skieur', 2, []) },
      Object.assign(ph(1, '(référentiel galiléen)'), { ok: e => e.gal && e.mru && e.nulle, preparer: () => regler('palet', 0, [[2, 0]]) }),
      Object.assign(ph(2, '(référentiel galiléen)'), { ok: e => e.gal && e.nulle && e.mru, preparer: () => regler('voiture', 2, [[0, 2], [-2, 0]]) }),
      Object.assign(ph(3, '(référentiel galiléen)'), { ok: e => e.gal && !e.mru && !e.nulle, preparer: () => regler('palet', 2, []) }),
      Object.assign(ph(4, '(référentiel galiléen)'), { ok: e => e.gal && !e.nulle && !e.mru, preparer: () => regler('skieur', 0, []) }),
      Object.assign(ph(5, '(passager du bus qui freine)'), { ok: e => !e.gal && e.mru && !e.nulle, preparer: () => regler('passager', 0, []) }),
      Object.assign(ph(6, '(passager du bus qui freine)'), { ok: e => !e.gal && !e.mru && e.nulle, preparer: () => regler('passager', 0, [[-2, 0]]) }),
    ];
    const d = LN.defis($('defis'), liste, {
      surReussite: l => {
        const n = l.map(i => i + 1), noms = n.length > 1 ? `Défis ${n.slice(0, -1).join(', ')} et ${n[n.length - 1]} réussis` : `Défi ${n[0]} réussi`;
        const ph = l.filter(i => i >= 3).map(i => `phrase ${i - 2}`);
        c.message(`<b>${noms} !</b>${ph.length ? ` La situation illustre la ${ph.join(' et la ')} du cours.` : ''}`, 'ok');
      },
      bilan: 'Tous les défis sont réussis : ouvre l\'onglet « Bilan » pour retenir l\'essentiel.',
    });

    // redessin quand la place change (rotation, plein écran)
    const redim = () => { geo = null; dessiner(); };
    if (window.ResizeObserver) new ResizeObserver(redim).observe(c.fig); else addEventListener('resize', redim);
    forces[0].coord = [0, 0];
    majReglages();
    dessiner();
  }

  LN.animInertie = animInertie;
})();
