/* ============================================================
   OSC : oscilloscope (application « Période et fréquence d'un signal »)

   Inspiré de la notice d'un oscilloscope numérique de lycée :
   - écran de 10 × 8 carreaux (axes centraux gradués en cinquièmes de carreau) ;
   - sous l'écran, à gauche la sensibilité verticale « CH1 », à droite la base de temps « Time » ;
   - à droite de l'écran, le menu des fonctions (affiché sur l'écran) et ses cinq boutons ;
   - touche « Cursor » (menu des curseurs) et bouton de réglage ↻ (déplace le ou les curseurs choisis).
   Menu Cursors : Mode (Fermé / Manuel), Type (X : curseurs horizontaux, mesure du temps ;
   Y : curseurs verticaux, mesure de la tension), Source (CH1), CurA, CurB (sélectionnables
   ensemble : les deux curseurs bougent alors en même temps).
   Valeurs des curseurs et différence (ΔX ou ΔY) affichées SOUS l'appareil (l'écran reste dégagé).
   Durées affichées en µs si la base de temps est inférieure à 1 ms, sinon en ms.

   OSC.monter(zone, o) → oscilloscope interactif (plusieurs exemplaires possibles dans une page)
     o = { signal: { forme, periode (ms), ampl (V), phase (ms), decal (V) },
           baseTemps (ms/carreau), sensibilite (V/carreau),
           curseurs : true → touche Cursor, menu, boutons et bouton de réglage,
           trait : true → un appui (ou un glisser) sur l'écran trace un trait vertical en pointillés,
           bases : [..] (ms/carreau) → réglage de la base de temps sous l'appareil,
           onChange(etat), onBase(b) }
     → { maj({ signal, baseTemps, sensibilite }), etat(), mesure(), appuyer(i | 'cursor'), tourner(n),
         poser(a, b), regler({ curseurs, trait }), surligner(a, b, texte), effacerMotif(),
         verrouiller(), deverrouiller(), activerBase(oui), detruire() }
     Positions des curseurs en carreaux (X : 0 à 10 depuis la gauche ; Y : 0 à 8 depuis le haut).
   OSC.svg(o, etat)          code SVG complet de l'écran (figures statiques des fiches) ; etat.motif : SVG ajouté
   OSC.mesures(o, etat)      valeurs des curseurs (HTML), OSC.etatVide() : état de départ
   OSC.f(o)                  fonction u(t) du signal (t en ms, u en V)
   OSC.unite(b)              unité des durées pour la base b : 'µs' ou 'ms' ; OSC.enU(v, u) : v (ms) dans cette unité
   OSC.baseTexte(b), OSC.sensTexte(s)   « 500,0 µs », « 2,00 V » (comme sur l'appareil)
   OSC.premierSommet(sit)    position (carreaux) du premier sommet principal visible

   OSC.question(zones, sit, o) : mesurer T sur l'écran
     zones = { figure, champs } ; sit = { signal, baseTemps, sensibilite }
     o = { methodes: ['carreaux', 'curseurs'] (méthodes proposées), methode (choix de départ),
           bases, onBase(b), onFini(T (ms), info), onErreur(), onPhase('compte'), onChange(etat de l'oscilloscope) }
     Carreaux : nombre de carreaux de n périodes et n, puis T = (nombre de carreaux × base de temps) / n ;
       refusé (sans erreur) si la durée ne se compte pas au cinquième de carreau.
     Curseurs : curseurs A et B sur deux points qui se correspondent, n, puis T = ΔX / n.
     info = { methode, n, unite ('µs' | 'ms'), Tu (T dans cette unité), base }
     → { ecran, methode(), activerBase(oui), montrer() }
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const W = 160, H = 118;                                // écran complet (mm « papier »)
  const X0 = 4, Y0 = 10, CAR = 12, NX = 10, NY = 8;      // quadrillage : 10 × 8 carreaux de 12 mm
  const XC = X0 + NX / 2 * CAR, YC = Y0 + NY / 2 * CAR;  // axes centraux
  const MX = 127, MW = 30, ME = 19.2;                    // colonne du menu : abscisse, largeur, hauteur d'une ligne
  const PAS = 0.04;                                      // pas du bouton de réglage (carreau)
  const fmt = (v, d) => PF.fmt(v, d);

  /* ---------- Unités et textes ---------- */
  const unite = b => (b < 1 ? 'µs' : 'ms');
  const enU = (v, u) => (u === 'µs' ? v * 1000 : v);
  const fr4 = v => v.toPrecision(4).replace('.', ',');
  const baseTexte = b => `${fr4(enU(b, unite(b)))} ${unite(b)}`;
  const sensTexte = s => (s < 1 ? `${fr4(s * 1000).replace(/,?0+$/, '')} mV` : `${s.toPrecision(3).replace('.', ',')} V`);
  // nombre de décimales des valeurs des curseurs (pas du bouton dans l'unité affichée)
  const decimales = pasU => Math.max(0, Math.ceil(-Math.log10(pasU) - 1e-9));

  // fonction u(t) du signal (t en ms)
  function f(o) {
    const s = o.signal, g = LG.FORMES[s.forme] || LG.FORMES.sinus;
    return t => (s.decal || 0) + s.ampl * g((t - (s.phase || 0)) / s.periode, s);
  }
  const xDe = c => X0 + c * CAR;
  const yDe = r => Y0 + r * CAR;

  // premier sommet principal visible (carreaux), pour la réponse affichée
  function premierSommet(sit) {
    const s = sit.signal, g = LG.FORMES[s.forme] || LG.FORMES.sinus;
    let uM = 0, best = -Infinity;
    for (let i = 0; i < 2000; i++) { const v = g(i / 2000, s); if (v > best) { best = v; uM = i / 2000; } }
    let t0 = (s.phase || 0) + uM * s.periode;
    while (t0 - s.periode >= -1e-9) t0 -= s.periode;
    while (t0 < -1e-9) t0 += s.periode;
    return t0 / sit.baseTemps;
  }

  /* ============================================================
     DESSIN DE L'ÉCRAN
     e = { menu, mode: 'Fermé' | 'Manuel', type: 'X' | 'Y', selA, selB, pos: { X: [a, b], Y: [a, b] }, ligne }
     ============================================================ */
  function fleche(x, y) {
    // petite flèche circulaire (↻) : le curseur se règle avec le bouton de réglage
    return `<path d="M${x + 2.2},${y - 1.3} A2.6,2.6 0 1 1 ${x - 1.6},${y - 2.1}" fill="none" stroke="currentColor" stroke-width=".7"/>
      <path d="M${x + 3.3},${y - 2.9} l-.2,2.5 l-2.3,-.9z" fill="currentColor"/>`;
  }
  function dessinMenu(e) {
    if (!e.menu) return '';
    let h = `<rect x="${MX}" y="1.2" width="${MW}" height="7.3" rx="1.2" fill="var(--accent)"/>
      <text x="${MX + MW / 2}" y="6.4" font-size="4.2" font-weight="800" text-anchor="middle" fill="var(--sheet)">Cursors</text>`;
    const lignes = e.mode === 'Manuel'
      ? [['Mode', 'Manuel'], ['Type', e.type], ['Source', 'CH1'], ['CurA', e.selA ? 'sel' : 'non'], ['CurB', e.selB ? 'sel' : 'non']]
      : [['Mode', 'Fermé']];
    lignes.forEach(([nom, val], i) => {
      const y = Y0 + i * ME, choisi = val === 'sel';
      h += `<text x="${MX + MW / 2}" y="${y + 6}" font-size="4" font-weight="700" text-anchor="middle" fill="var(--ink)">${nom}</text>`;
      h += `<rect x="${MX + 2}" y="${y + 8}" width="${MW - 4}" height="8.4" rx="1.4" fill="${choisi ? 'var(--accent)' : 'var(--sheet)'}" stroke="${choisi ? 'var(--accent)' : 'var(--ink-3)'}" stroke-width=".4"/>`;
      if (val === 'sel' || val === 'non') h += `<g color="${choisi ? 'var(--sheet)' : 'var(--ink-2)'}">${fleche(MX + MW / 2, y + 13.6)}</g>`;
      else h += `<text x="${MX + MW / 2}" y="${y + 13.8}" font-size="4.2" font-weight="800" text-anchor="middle" fill="var(--ink)">${val}</text>`;
    });
    return h;
  }
  function dessinCurseurs(e) {
    if (!e.menu || e.mode !== 'Manuel') return '';
    const [a, b] = e.pos[e.type];
    return [[a, 'A', e.selA], [b, 'B', e.selB]].map(([c, nom, sel]) => {
      const coul = sel ? 'var(--accent-ink)' : 'var(--ink-2)', l = sel ? .6 : .45;
      if (e.type === 'X') {
        const x = xDe(c);
        return `<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0 + NY * CAR}" stroke="${coul}" stroke-width="${l}" stroke-dasharray="1.8,1.2"/>
          <text x="${x}" y="${Y0 - 2}" font-size="4" font-weight="800" text-anchor="middle" fill="${coul}">${nom}</text>`;
      }
      const y = yDe(c);
      return `<line x1="${X0}" y1="${y}" x2="${X0 + NX * CAR}" y2="${y}" stroke="${coul}" stroke-width="${l}" stroke-dasharray="1.8,1.2"/>
        <text x="${X0 + NX * CAR - 1.5}" y="${y - 1.2}" font-size="4" font-weight="800" text-anchor="end" fill="${coul}">${nom}</text>`;
    }).join('');
  }
  function dessinFond(o) {
    const b = o.baseTemps, sv = o.sensibilite, u = f(o);
    let h = `<rect x=".4" y=".4" width="${W - .8}" height="${H - .8}" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width=".8"/>`;
    // quadrillage pointillé (trait --ink-3 léger : le --paper-3 ne se voit pas sur --paper, or il faut compter les carreaux)
    for (let i = 0; i <= NX; i++) if (i !== NX / 2) h += `<line x1="${xDe(i)}" y1="${Y0}" x2="${xDe(i)}" y2="${Y0 + NY * CAR}" stroke="var(--ink-3)" stroke-opacity="${i % NX ? .45 : .8}" stroke-width=".4" stroke-dasharray="${i % NX ? '.9,1.1' : 'none'}"/>`;
    for (let j = 0; j <= NY; j++) if (j !== NY / 2) h += `<line x1="${X0}" y1="${yDe(j)}" x2="${X0 + NX * CAR}" y2="${yDe(j)}" stroke="var(--ink-3)" stroke-opacity="${j % NY ? .45 : .8}" stroke-width=".4" stroke-dasharray="${j % NY ? '.9,1.1' : 'none'}"/>`;
    // axes centraux gradués en cinquièmes de carreau
    h += `<line x1="${X0}" y1="${YC}" x2="${X0 + NX * CAR}" y2="${YC}" stroke="var(--ink-3)" stroke-width=".4"/>`;
    h += `<line x1="${XC}" y1="${Y0}" x2="${XC}" y2="${Y0 + NY * CAR}" stroke="var(--ink-3)" stroke-width=".4"/>`;
    for (let k = 1; k < NX * 5; k++) { const x = X0 + k * CAR / 5, l = k % 5 ? 1 : 1.8; h += `<line x1="${x}" y1="${YC - l}" x2="${x}" y2="${YC + l}" stroke="var(--ink-3)" stroke-width=".35"/>`; }
    for (let k = 1; k < NY * 5; k++) { const y = Y0 + k * CAR / 5, l = k % 5 ? 1 : 1.8; h += `<line x1="${XC - l}" y1="${y}" x2="${XC + l}" y2="${y}" stroke="var(--ink-3)" stroke-width=".35"/>`; }
    // trace
    let d = '';
    for (let i = 0; i <= 800; i++) {
      const t = NX * b * i / 800, y = Math.max(Y0, Math.min(Y0 + NY * CAR, YC - u(t) / sv * CAR));
      d += (i ? 'L' : 'M') + (X0 + NX * CAR * i / 800).toFixed(2) + ',' + y.toFixed(2);
    }
    h += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width=".9" stroke-linejoin="round"/>`;
    // sous l'écran : sensibilité verticale (CH1) à gauche, base de temps (Time) à droite
    h += `<rect x="${X0}" y="${H - 9.6}" width="7.6" height="5.6" rx=".8" fill="var(--accent)"/>
      <text x="${X0 + 3.8}" y="${H - 5.4}" font-size="3.6" font-weight="800" text-anchor="middle" fill="var(--sheet)">CH1</text>
      <text x="${X0 + 9.6}" y="${H - 5.2}" font-size="4.2" font-weight="700" fill="var(--ink)">${sensTexte(sv)}</text>
      <text x="${X0 + NX * CAR}" y="${H - 5.2}" font-size="4.2" font-weight="700" text-anchor="end" fill="var(--ink)">Time ${baseTexte(b)}</text>`;
    return h;
  }
  const dessinLigne = e => (e.ligne == null ? '' : `<line x1="${xDe(e.ligne)}" y1="${Y0}" x2="${xDe(e.ligne)}" y2="${Y0 + NY * CAR}" stroke="var(--ink)" stroke-width=".45" stroke-dasharray="1.5,1.1"/>`);
  const etatVide = () => ({ menu: false, mode: 'Fermé', type: 'X', selA: false, selB: false, pos: { X: [2, 8], Y: [2, 6] }, ligne: null });
  // écran complet (figure statique)
  function svg(o, e) {
    e = Object.assign(etatVide(), e || {});
    return `<svg class="osc-svg" viewBox="0 0 ${W} ${H}" xmlns="${NS}" role="img" aria-label="Écran d'oscilloscope : 10 carreaux en largeur, 8 en hauteur">${dessinFond(o)}${dessinMenu(e)}${dessinCurseurs(e)}${dessinLigne(e)}${e.motif || ''}</svg>`;
  }
  // morceau de trace surligné entre deux positions (carreaux) et double flèche au-dessus
  function motif(o, a, b, texte) {
    const u = f(o);
    let d = '', yMin = Infinity;
    for (let i = 0; i <= 240; i++) {
      const c = a + (b - a) * i / 240, y = Math.max(Y0, Math.min(Y0 + NY * CAR, YC - u(c * o.baseTemps) / o.sensibilite * CAR));
      yMin = Math.min(yMin, y);
      d += (i ? 'L' : 'M') + xDe(c).toFixed(2) + ',' + y.toFixed(2);
    }
    const x1 = xDe(a), x2 = xDe(b), yF = Math.max(Y0 + 6, yMin - 4);
    const pointe = (x, s) => `M${x},${yF} l${s * 2.2},-1.2 v2.4z`;
    const w = texte ? texte.replace(/<[^>]+>/g, '').length * 2.6 + 3 : 0;
    return `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-opacity=".35" stroke-linecap="round"/>
      <line x1="${x1 + 1}" y1="${yF}" x2="${x2 - 1}" y2="${yF}" stroke="var(--accent-ink)" stroke-width=".6"/>
      <path d="${pointe(x1, 1)} ${pointe(x2, -1)}" fill="var(--accent-ink)"/>
      ${texte ? `<rect x="${(x1 + x2) / 2 - w / 2}" y="${yF - 5.6}" width="${w}" height="5" rx="1" fill="var(--paper)"/>
      <text x="${(x1 + x2) / 2}" y="${yF - 1.7}" font-size="4.2" font-weight="800" text-anchor="middle" fill="var(--accent-ink)">${texte}</text>` : ''}`;
  }

  // valeurs des curseurs (HTML), comme sur l'appareil mais sous l'écran
  function mesuresHTML(o, e) {
    let fmt = (v, d) => PF.fmt(v, d);
    if (!e.menu || e.mode !== 'Manuel') return '';
    const [a, b] = e.pos[e.type];
    let va, vb, nom, u, dec;
    if (e.type === 'X') {
      u = unite(o.baseTemps); dec = decimales(enU(PAS * o.baseTemps, u));
      va = enU((a - NX / 2) * o.baseTemps, u); vb = enU((b - NX / 2) * o.baseTemps, u); nom = 'ΔX';
    } else {
      u = 'V'; dec = decimales(PAS * o.sensibilite);
      va = (NY / 2 - a) * o.sensibilite; vb = (NY / 2 - b) * o.sensibilite; nom = 'ΔY';
    }
    const d = Math.abs(vb - va);
    // sans décimale : séparateur des milliers (1 200 µs)
    if (!dec) fmt = v => PF.fmt(Math.round(v));
    return `<span>CurA = <b>${fmt(va, dec)} ${u}</b></span><span>CurB = <b>${fmt(vb, dec)} ${u}</b></span><span class="osc-delta">${nom} = <b>${fmt(d, dec)} ${u}</b></span>`;
  }

  /* ============================================================
     OSCILLOSCOPE INTERACTIF
     ============================================================ */
  const TOUCHES = [
    { nom: 'Mode', aria: 'Bouton 1 du menu : Mode' },
    { nom: 'Type', aria: 'Bouton 2 du menu : Type de curseurs (X ou Y)' },
    { nom: 'Source', aria: 'Bouton 3 du menu : Source' },
    { nom: 'CurA', aria: 'Bouton 4 du menu : sélectionner le curseur A' },
    { nom: 'CurB', aria: 'Bouton 5 du menu : sélectionner le curseur B' },
  ];
  function monter(zone, o) {
    o = Object.assign({ curseurs: false, trait: false }, o);
    const e = etatVide();
    let verrou = false, gMotif = '', baseActive = true;
    const box = document.createElement('div');
    box.className = 'osc';
    box.innerHTML = `<div class="osc-face">
        <div class="osc-corps">
          <div class="osc-ecran"><svg class="osc-svg" viewBox="0 0 ${W} ${H}" xmlns="${NS}" role="img" aria-label="Écran d'oscilloscope : 10 carreaux en largeur, 8 en hauteur"></svg></div>
          <div class="osc-soft">${TOUCHES.map((t, i) => `<button type="button" class="osc-touche" data-t="${i}" aria-label="${t.aria}" style="top:${((Y0 + i * ME + .6) / H * 100).toFixed(2)}%;height:${((ME - 1.2) / H * 100).toFixed(2)}%"></button>`).join('')}</div>
          <div class="osc-panneau">
            <div class="osc-groupe"><span class="osc-groupe-t">MENU</span><button type="button" class="osc-cursor" data-a="cursor">Cursor</button></div>
            <div class="osc-groupe"><span class="osc-groupe-t">Réglage</span>
              <button type="button" class="osc-bouton" data-a="bouton" aria-label="Bouton de réglage : tourne-le (ou appuie sur sa moitié gauche ou droite) pour déplacer le curseur sélectionné"><span class="osc-bouton-ind"></span></button>
              <span class="osc-bouton-l">↺ ↻</span></div>
          </div>
        </div>
      </div>
      <div class="osc-mesures" aria-live="polite"></div>
      ${o.bases ? `<div class="osc-base" data-a="base"><span class="osc-base-t">Base de temps (Time)</span>
          <button type="button" class="btn-secondary osc-fl" data-a="bMoins" aria-label="Base de temps plus petite">−</button>
          <select class="osc-select" data-a="bSel" aria-label="Base de temps">${o.bases.map(b => `<option value="${b}">${baseTexte(b)}</option>`).join('')}</select>
          <button type="button" class="btn-secondary osc-fl" data-a="bPlus" aria-label="Base de temps plus grande">+</button></div>` : ''}`;
    zone.appendChild(box);
    const svgE = box.querySelector('svg'), $ = a => box.querySelector(`[data-a="${a}"]`);
    const mes = box.querySelector('.osc-mesures');

    function peindre() {
      svgE.innerHTML = dessinFond(o) + (o.curseurs ? dessinMenu(e) + dessinCurseurs(e) : '') + (o.trait ? dessinLigne(e) : '') + gMotif;
      mes.innerHTML = o.curseurs ? (mesuresHTML(o, e) || '<span class="osc-mes-vide">Curseurs fermés : appuie sur Cursor, puis règle le Mode sur Manuel.</span>') : '';
      mes.hidden = !o.curseurs;
      box.classList.toggle('osc-sans-curseurs', !o.curseurs);
    }
    function changer() { peindre(); if (o.onChange) o.onChange(etat()); }
    const etat = () => ({ menu: e.menu, mode: e.mode, type: e.type, selA: e.selA, selB: e.selB, a: e.pos[e.type][0], b: e.pos[e.type][1], ligne: e.ligne });

    /* ----- touches ----- */
    function appuyer(i) {
      if (verrou || !o.curseurs) return;
      if (i === 'cursor') {
        // Cursor : affiche le menu des curseurs ; appuyé de nouveau, change le mode
        if (!e.menu) e.menu = true; else e.mode = e.mode === 'Manuel' ? 'Fermé' : 'Manuel';
      } else if (!e.menu) return;
      else if (i === 0) e.mode = e.mode === 'Manuel' ? 'Fermé' : 'Manuel';
      else if (e.mode !== 'Manuel') return;
      else if (i === 1) e.type = e.type === 'X' ? 'Y' : 'X';
      else if (i === 3) e.selA = !e.selA;
      else if (i === 4) e.selB = !e.selB;
      changer();
    }
    box.querySelectorAll('.osc-touche').forEach(b => { b.onclick = () => appuyer(+b.dataset.t); });
    $('cursor').onclick = () => appuyer('cursor');

    /* ----- bouton de réglage ----- */
    const bouton = $('bouton'), ind = bouton.querySelector('.osc-bouton-ind');
    let angleVu = 0;
    function tourner(n) {
      if (verrou || !o.curseurs || !e.menu || e.mode !== 'Manuel' || !n) return false;
      const max = e.type === 'X' ? NX : NY, p = e.pos[e.type];
      if (!e.selA && !e.selB) {
        mes.innerHTML = mesuresHTML(o, e) + '<span class="osc-mes-vide">Sélectionne CurA ou CurB (boutons à droite de l\'écran) pour déplacer un curseur.</span>';
        return false;
      }
      [0, 1].forEach(k => {
        if (k === 0 ? e.selA : e.selB) p[k] = Math.max(0, Math.min(max, Math.round((p[k] + n * PAS) / PAS) * PAS));
      });
      changer();
      return true;
    }
    const tournerVisuel = da => { angleVu += da; ind.style.transform = `rotate(${angleVu}deg)`; };
    // glisser autour du bouton : 8° = un pas (plus vite si on tourne vite) ; appui bref : moitié gauche −1, droite +1
    let rot = null;
    const angle = ev => { const r = bouton.getBoundingClientRect(); return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    bouton.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault();
      rot = { id: ev.pointerId, a: angle(ev), acc: 0, tot: 0, t: performance.now(), x: ev.clientX };
      try { bouton.setPointerCapture(ev.pointerId); } catch (err) { /* sans capture */ }
    });
    bouton.addEventListener('pointermove', ev => {
      if (!rot || ev.pointerId !== rot.id) return;
      ev.preventDefault();
      let a = angle(ev), da = a - rot.a;
      if (da > 180) da -= 360; if (da < -180) da += 360;
      const t = performance.now(), v = Math.abs(da) / Math.max(1, t - rot.t);
      rot.a = a; rot.t = t; rot.tot += Math.abs(da);
      tournerVisuel(da);
      rot.acc += da * (v > 0.6 ? 5 : v > 0.25 ? 2 : 1);
      const n = Math.trunc(rot.acc / 8);
      if (n) { rot.acc -= n * 8; tourner(n); }
    });
    const finRot = ev => {
      if (!rot || ev.pointerId !== rot.id) return;
      if (rot.tot < 6 && ev.type === 'pointerup') {
        const r = bouton.getBoundingClientRect(), s = rot.x < r.left + r.width / 2 ? -1 : 1;
        tournerVisuel(s * 10); tourner(s);
      }
      rot = null;
    };
    bouton.addEventListener('pointerup', finRot);
    bouton.addEventListener('pointercancel', finRot);
    bouton.addEventListener('touchstart', ev => ev.preventDefault(), { passive: false });
    bouton.addEventListener('keydown', ev => {
      const s = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[ev.key];
      if (!s) return;
      ev.preventDefault(); tournerVisuel(s * 10); tourner(s * (ev.shiftKey ? 5 : 1));
    });
    bouton.addEventListener('click', ev => ev.preventDefault());

    /* ----- trait vertical en pointillés (comptage des carreaux) ----- */
    let glisse = null;
    const enCarreaux = ev => { const m = svgE.getScreenCTM(); return ((ev.clientX - m.e) / m.a - X0) / CAR; };
    const poserLigne = ev => { const c = enCarreaux(ev); if (c < -0.2 || c > NX + 0.2) return; e.ligne = Math.max(0, Math.min(NX, c)); peindre(); };
    svgE.addEventListener('pointerdown', ev => {
      if (!o.trait || verrou || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      const m = svgE.getScreenCTM(), y = (ev.clientY - m.f) / m.d;
      if (y < Y0 - 2 || y > Y0 + NY * CAR + 2) return;
      glisse = ev.pointerId; poserLigne(ev);
    });
    const bougerLigne = ev => { if (glisse === ev.pointerId) poserLigne(ev); };
    const finLigne = ev => { if (glisse === ev.pointerId) glisse = null; };
    window.addEventListener('pointermove', bougerLigne);
    window.addEventListener('pointerup', finLigne);
    window.addEventListener('pointercancel', finLigne);

    /* ----- base de temps ----- */
    if (o.bases) {
      const sel = $('bSel');
      sel.value = String(o.baseTemps);
      const regler = b => {
        if (!baseActive || b === o.baseTemps) return;
        o.baseTemps = b; sel.value = String(b); gMotif = '';
        changer();
        if (o.onBase) o.onBase(b);
      };
      sel.onchange = () => regler(+sel.value);
      $('bMoins').onclick = () => { const i = o.bases.indexOf(o.baseTemps); if (i > 0) regler(o.bases[i - 1]); };
      $('bPlus').onclick = () => { const i = o.bases.indexOf(o.baseTemps); if (i < o.bases.length - 1) regler(o.bases[i + 1]); };
    }

    peindre();
    return {
      el: box,
      maj(n) { Object.assign(o, n); if (o.bases && n.baseTemps) $('bSel').value = String(o.baseTemps); gMotif = ''; changer(); },
      etat, appuyer, tourner,
      // mesure des curseurs : positions (carreaux), écart d en carreaux
      mesure() { const [a, b] = e.pos[e.type]; return { a, b, d: Math.abs(b - a), type: e.type, actifs: e.menu && e.mode === 'Manuel' }; },
      poser(a, b) { e.pos[e.type] = [Math.round(a / PAS) * PAS, Math.round(b / PAS) * PAS]; changer(); },
      ouvrirCurseurs() { e.menu = true; e.mode = 'Manuel'; e.type = 'X'; changer(); },
      regler(r) { Object.assign(o, r); if (!o.trait) e.ligne = null; changer(); },
      surligner(a, b, texte) { gMotif = motif(o, a, b, texte); peindre(); },
      effacerMotif() { gMotif = ''; peindre(); },
      verrouiller() { verrou = true; box.classList.add('osc-verrou'); },
      deverrouiller() { verrou = false; box.classList.remove('osc-verrou'); },
      activerBase(oui) {
        baseActive = oui;
        if (o.bases) box.querySelectorAll('[data-a="base"] button, [data-a="base"] select').forEach(x => { x.disabled = !oui; });
      },
      detruire() {
        window.removeEventListener('pointermove', bougerLigne);
        window.removeEventListener('pointerup', finLigne);
        window.removeEventListener('pointercancel', finLigne);
      },
    };
  }

  /* ============================================================
     MESURER T SUR L'ÉCRAN : en comptant les carreaux ou avec les curseurs
     ============================================================ */
  const ORD = ['premier', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'septième', 'huitième', 'neuvième', 'dixième', 'onzième'];
  const NOMS_M = { carreaux: 'En comptant les carreaux', curseurs: 'En utilisant les curseurs' };
  let nQ = 0;
  function question(zones, sit, o) {
    o = o || {};
    const id = 'osc' + (++nQ) + '_';
    const S = Object.assign({}, sit);
    const methodes = o.methodes && o.methodes.length ? o.methodes : ['carreaux', 'curseurs'];
    let methode = methodes.indexOf(o.methode) >= 0 ? o.methode : methodes[0];
    let fini = false, phase = 'compte', resCompte = null;
    const zF = zones.figure, zC = zones.champs;
    const u = () => unite(S.baseTemps), bU = () => enU(S.baseTemps, u());

    // choix de la méthode (s'il y en a deux), puis l'oscilloscope
    const bloc = document.createElement('div');
    bloc.className = 'osc-q';
    bloc.innerHTML = `${methodes.length > 1 ? `<div class="lg-methode" role="radiogroup" aria-label="Méthode de mesure"><span class="lg-methode-t">Méthode de mesure :</span>
        ${methodes.map(m => `<button type="button" role="radio" class="lg-meth" data-m="${m}" aria-checked="false">${NOMS_M[m]}</button>`).join('')}</div>` : ''}
      <p class="lg-aide-regle" data-a="aideCar">Touche l'écran (ou fais glisser ton doigt ou la souris) : un trait vertical en pointillés t'aide à repérer où tu es sur l'axe des temps.</p>
      <p class="lg-aide-regle" data-a="aideCur">Appuie sur <b>Cursor</b>, règle le menu avec les boutons à droite de l'écran (Mode : Manuel, Type : X), choisis <b>CurA</b> et/ou <b>CurB</b>, puis tourne le <b>bouton de réglage</b> (ou appuie sur sa moitié gauche ou droite).</p>
      <div data-a="ecran"></div>`;
    zF.appendChild(bloc);
    const $ = a => bloc.querySelector(`[data-a="${a}"]`);
    const ecran = monter($('ecran'), {
      signal: S.signal, baseTemps: S.baseTemps, sensibilite: S.sensibilite, bases: o.bases,
      curseurs: methode === 'curseurs', trait: methode === 'carreaux',
      onChange(st) { if (!fini && refs.msg && methode === 'curseurs') refs.msg.innerHTML = ''; if (o.onChange) o.onChange(st); },
      onBase(b) { S.baseTemps = b; majUnites(); if (o.onBase) o.onBase(b); },
    });

    // champs (zone des champs)
    const champ = (k, lab, unit, entier, calc) => `<label class="osc-dl"><span class="osc-dl-l">${lab}</span><span class="osc-dl-in"><input type="text" id="${id + k}" class="ph-champ osc-champ" inputmode="${entier ? 'numeric' : 'decimal'}" autocomplete="off" spellcheck="false"><span class="lg-dl-u" data-u="${k}">${unit}</span>${calc ? PF.CALC : ''}</span></label>`;
    const champs = document.createElement('div');
    champs.className = 'osc-champs';
    champs.innerHTML = `<div data-a="pCompte">
        ${champ('car', 'Nombre de carreaux de n périodes :', 'carreaux')}
        ${champ('n', 'Nombre de périodes : n =', 'périodes', true)}
        <div class="er-actions"><button type="button" class="btn-primary" data-a="vCompte">Vérifier</button></div></div>
      <div data-a="pT" hidden>
        <p class="osc-rappel" data-a="rappel"></p>
        ${champ('T', 'T = (nombre de carreaux × base de temps) / n =', '', false, true)}
        <div class="er-actions"><button type="button" class="btn-primary" data-a="vT">Vérifier</button></div></div>
      <div data-a="pCur" hidden>
        ${champ('nc', 'Nombre de périodes entre les curseurs A et B : n =', 'périodes', true)}
        ${champ('Tc', 'T = ΔX / n =', '', false, true)}
        <div class="er-actions"><button type="button" class="btn-primary" data-a="vCur">Vérifier</button></div></div>
      <div data-a="msg" aria-live="polite"></div>`;
    zC.appendChild(champs);
    // références gardées : la page peut déplacer ces éléments (déroulé guidé)
    const refs = {};
    champs.querySelectorAll('[data-a]').forEach(x => { refs[x.dataset.a] = x; });
    champs.querySelectorAll('input').forEach(x => { refs['#' + x.id] = x; });
    champs.querySelectorAll('[data-u]').forEach(x => { refs['u' + x.dataset.u] = x; });
    const inp = k => refs['#' + id + k];
    function majUnites() { refs.uT.textContent = u(); refs.uTc.textContent = u(); }
    majUnites();
    ['car', 'n', 'T', 'nc', 'Tc'].forEach(k => {
      inp(k).addEventListener('input', () => inp(k).classList.remove('is-ok', 'is-ko'));
      inp(k).addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); ({ car: verifierCompte, n: verifierCompte, T: verifierT, nc: verifierCurseurs, Tc: verifierCurseurs })[k](); } });
    });
    const msg = h => { refs.msg.innerHTML = h; };
    const info = t => `<div class="callout pf-info"><p>${t}</p></div>`;
    const ko = l => `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${l.join(' ')}</p></div>`;
    const marque = (k, ok) => { inp(k).classList.toggle('is-ok', ok); inp(k).classList.toggle('is-ko', !ok); };
    const erreur = l => { msg(ko(l)); if (o.onErreur) o.onErreur(); };
    const p = (a, b, r) => Math.abs(a - b) <= (r || 0.01) * Math.abs(b);
    const q1 = () => S.signal.periode / S.baseTemps;                       // carreaux d'une période
    const kMax = () => Math.floor(NX / q1() + 1e-9);
    const conseil = k => (k < kMax() ? info(`Tu pouvais mesurer ${kMax()} périodes sur l'écran : plus il y a de périodes, plus la mesure est précise.`) : '');
    // durée de k périodes comptable au cinquième de carreau ?
    const comptable = k => Math.abs(k * q1() * 5 - Math.round(k * q1() * 5)) <= 0.25;
    function finir(k, Tu, quoi) {
      fini = true;
      bloc.querySelectorAll('.lg-meth').forEach(b => { b.disabled = true; });
      // motif surligné à partir du premier sommet
      let a = premierSommet(S);
      if (a + k * q1() > NX + 1e-6) a = Math.max(0, NX - k * q1());
      ecran.surligner(a, a + k * q1(), (k > 1 ? k : '') + 'T');
      ecran.verrouiller();
      if (o.onFini) o.onFini(u() === 'µs' ? Tu / 1000 : Tu, { methode: quoi, n: k, unite: u(), Tu, base: S.baseTemps });
    }
    // valeur fausse de T : erreurs reconnues (réunies si une valeur correspond à plusieurs erreurs)
    function diagT(v, c, n, avecCarreaux) {
      const d = [], b = bU(), sv = S.sensibilite;
      if (avecCarreaux && (p(v, c / n) || p(v, c))) d.push('Tu as donné des carreaux, pas une durée : multiplie le nombre de carreaux par la base de temps (Time).');
      if (avecCarreaux && (p(v, c * sv / n) || p(v, c * sv))) d.push('Tu as utilisé la sensibilité verticale (CH1, en V/carreau) : pour une durée, on utilise la base de temps (Time).');
      const duree = avecCarreaux ? c * b : c;
      if (n > 1 && p(v, duree)) d.push(`Tu as la durée de ${n} périodes : divise par n = ${n}.`);
      if (n > 1 && p(v, duree * n)) d.push('Il faut diviser par n, pas multiplier.');
      if (u() === 'µs' && p(v, duree / n / 1000)) d.push('La base de temps est en µs : écris T en µs.');
      if (!d.length && avecCarreaux && (p(v, c / b / n) || p(v, c / b))) d.push('On multiplie le nombre de carreaux par la base de temps, on ne divise pas.');
      if (d.length > 1) return ['T = (nombre de carreaux × base de temps) / n : vérifie les points suivants.', ...d.map(x => '<br>· ' + x)];
      return [d[0] || (avecCarreaux ? 'T = (nombre de carreaux × base de temps) / n, avec la base de temps lue après « Time ».' : 'T = ΔX / n, avec ΔX lu sous l\'écran.')];
    }
    const versCurseurs = () => (methodes.indexOf('curseurs') >= 0
      ? info('En comptant les carreaux, cette durée ne se lit pas assez précisément : utilise les curseurs.<br><button type="button" class="btn-small osc-vers-cur">Utiliser les curseurs</button>')
      : info('Cette durée ne tombe pas sur un nombre exact de cinquièmes de carreau : choisis un autre nombre de périodes.'));

    /* ----- En comptant les carreaux : étape « compter » ----- */
    function verifierCompte() {
      if (fini || phase !== 'compte') return;
      const vc = PF.lire(inp('car').value), vn = PF.lire(inp('n').value);
      if (isNaN(vc) || isNaN(vn)) { msg(info('Écris un nombre dans chaque case (avec une virgule si besoin).')); return; }
      if (!(vn >= 1 && Math.round(vn) === vn)) { marque('n', false); erreur(['n est un nombre entier de périodes.']); return; }
      const Q = q1();
      // la durée de vn périodes ne se compte pas au cinquième de carreau : renvoi vers les curseurs (sans erreur)
      if (!comptable(vn) && Math.abs(vc - vn * Q) <= 0.3) {
        msg(versCurseurs());
        const b = refs.msg.querySelector('.osc-vers-cur');
        if (b) b.onclick = () => choisir('curseurs');
        return;
      }
      const k = Math.round(vc / Q), corr = k >= 1 && Math.abs(vc - k * Q) <= 0.12 && vc <= NX + 0.05;
      const err = [];
      marque('car', corr);
      if (!corr) err.push('Compte les carreaux entre deux points qui se correspondent (deux sommets, deux creux…), au cinquième de carreau près : sur l\'axe central, un petit trait vaut 0,2 carreau.');
      const okN = corr && vn === k;
      marque('n', okN || !corr);
      if (corr && !okN) err.push(vn === k + 1 && ORD[k] ? `Entre le premier et le ${ORD[k]} sommet, il y a ${k} périodes, pas ${k + 1}.` : `n : compte les motifs entiers sur les ${fmt(vc)} carreaux.`);
      if (err.length) { erreur(err); return; }
      phase = 'T';
      resCompte = { c: vc, n: k };
      ['car', 'n'].forEach(x => { inp(x).disabled = true; });
      refs.vCompte.disabled = true;
      ecran.activerBase(false);
      refs.rappel.innerHTML = `${k > 1 ? `${k} périodes` : 'Une période'} : ${fmt(vc)} carreaux. Time : ${baseTexte(S.baseTemps)} par carreau ; CH1 : ${sensTexte(S.sensibilite)} par carreau.`;
      msg(`<p class="ph-ok">✓ Comptage juste.</p>${conseil(k)}`);
      refs.pT.hidden = false;
      if (o.onPhase) o.onPhase('compte');
      if (PF.surOrdi()) inp('T').focus({ preventScroll: true });
      PF.amener(refs.pT);
    }
    /* ----- En comptant les carreaux : T = (nombre de carreaux × base de temps) / n ----- */
    function verifierT() {
      if (fini || phase !== 'T') return;
      const v = PF.lire(inp('T').value);
      if (isNaN(v)) { msg(info('Écris un nombre (avec une virgule si besoin).')); return; }
      const { c, n } = resCompte, T = c * bU() / n;
      const ok = p(v, T);
      marque('T', ok);
      if (!ok) { erreur(diagT(v, c, n, true)); return; }
      inp('T').disabled = true; refs.vT.disabled = true;
      msg(`<p class="ph-ok">✓ T = (${fmt(c)} × ${fmt(bU())}) / ${n} = ${fmt(+T.toPrecision(3))} ${u()}</p>`);
      finir(n, T, 'carreaux');
    }
    /* ----- Avec les curseurs : n et T = ΔX / n ----- */
    function verifierCurseurs() {
      if (fini) return;
      const m = ecran.mesure();
      if (!m.actifs || m.type !== 'X') { msg(info('Affiche d\'abord les curseurs de temps : appuie sur <b>Cursor</b>, puis règle <b>Mode : Manuel</b> et <b>Type : X</b>.')); return; }
      const vn = PF.lire(inp('nc').value), v = PF.lire(inp('Tc').value);
      if (isNaN(vn) || isNaN(v)) { msg(info('Écris un nombre dans chaque case (avec une virgule si besoin).')); return; }
      const Q = q1(), k = Math.round(m.d / Q);
      if (k < 1 || Math.abs(m.d - k * Q) > Math.max(0.1, 0.025 * k * Q)) {
        erreur(['Les curseurs A et B ne sont pas sur deux points qui se correspondent : place-les sur deux sommets (ou deux creux), une ou plusieurs périodes plus loin.']);
        return;
      }
      const err = [];
      const okN = vn === k;
      marque('nc', okN);
      if (!okN) err.push(vn === k + 1 && ORD[k] ? `Entre le premier et le ${ORD[k]} sommet, il y a ${k} périodes, pas ${k + 1}.` : 'n : compte les motifs entiers entre les curseurs A et B.');
      // ΔX tel qu'il est affiché sous l'écran
      const dec = decimales(enU(PAS * S.baseTemps, u())), dX = +(m.d * bU()).toFixed(dec);
      const T = dX / k;
      const okT = p(v, T, 0.012) || p(v, enU(S.signal.periode, u()), 0.02);
      marque('Tc', okT);
      if (!okT) err.push(...diagT(v, dX, okN ? k : Math.max(1, vn), false));
      if (err.length) { erreur(err); return; }
      ['nc', 'Tc'].forEach(x => { inp(x).disabled = true; });
      refs.vCur.disabled = true;
      ecran.activerBase(false);
      msg(`<p class="ph-ok">✓ T = ${fmt(dX, dec)} / ${k} ${PF.egal(T)} ${PF.court(T)} ${u()}</p>${conseil(k)}`);
      finir(k, v, 'curseurs');
    }
    refs.vCompte.onclick = verifierCompte;
    refs.vT.onclick = verifierT;
    refs.vCur.onclick = verifierCurseurs;

    function choisir(m) {
      if (fini || methodes.indexOf(m) < 0) return;
      methode = m;
      bloc.querySelectorAll('.lg-meth').forEach(b => b.setAttribute('aria-checked', String(b.dataset.m === m)));
      $('aideCar').hidden = m !== 'carreaux';
      $('aideCur').hidden = m !== 'curseurs';
      refs.pCompte.hidden = m !== 'carreaux';
      refs.pT.hidden = m !== 'carreaux' || phase !== 'T';
      refs.pCur.hidden = m !== 'curseurs';
      ecran.regler({ curseurs: m === 'curseurs', trait: m === 'carreaux' });
      if (phase !== 'T') msg('');
    }
    bloc.querySelectorAll('.lg-meth').forEach(b => { b.onclick = () => choisir(b.dataset.m); });
    choisir(methode);

    return {
      ecran,
      methode: () => methode,
      activerBase(oui) { ecran.activerBase(oui); },
      // réponse affichée : le plus grand nombre de périodes mesurable, surligné (curseurs posés dessus)
      montrer() {
        fini = true;
        const Q = q1();
        let a = premierSommet(S);
        const k = Math.max(1, Math.floor((NX - a) / Q + 1e-9));
        if (methode === 'curseurs') { ecran.ouvrirCurseurs(); ecran.poser(a, a + k * Q); }
        ecran.surligner(a, a + k * Q, (k > 1 ? k : '') + 'T');
        ecran.verrouiller();
        champs.hidden = true;
        bloc.querySelectorAll('.lg-meth').forEach(b => { b.disabled = true; });
        return { k, carreaux: +(k * Q).toFixed(2), unite: u(), Tu: enU(S.signal.periode, u()) };
      },
    };
  }

  window.OSC = { monter, svg, motif, mesures: mesuresHTML, etatVide, f, unite, enU, baseTexte, sensTexte, premierSommet, question, CAR, NX, NY };
})();
