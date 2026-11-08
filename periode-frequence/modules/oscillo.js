/* ============================================================
   OSC : écran d'oscilloscope (application « Période et fréquence d'un signal »)

   Écran de 10 × 8 carreaux dessiné en SVG, dans le même repère que les
   graphiques LG (viewBox 180 × 112, unité : le millimètre « papier ») :
   la règle virtuelle de LG peut donc mesurer sur l'écran.
   Fond --paper, cadre --ink, quadrillage pointillé --paper-3, axes centraux
   gradués en cinquièmes de carreau, trace --accent, curseurs verticaux --ink-2.

   OSC.monter(zone, o) → écran interactif (plusieurs exemplaires par page)
     o = { signal: { forme, periode (ms), ampl (V), phase (ms), decal (V) },
           baseTemps (ms/carreau), sensibilite (V/carreau),
           curseurs: true (deux curseurs verticaux glissables, aimantés au dixième de carreau),
           onChange({ c1, c2, sel }) }
     → { svg, maj({ signal, baseTemps, sensibilite }), curseurs() → [c1, c2] (carreaux, triés),
         choisir(i), deplacer(s) (± 0,1 carreau sur le curseur choisi), poser(c1, c2),
         surligner(c1, c2, texte), effacerMotif(), verrouiller(), etat() }
   OSC.dessin(o)    code SVG de l'écran (sans balise <svg>), o comme ci-dessus
   OSC.graphe(o)    fonction (R, A, def) → code SVG, pour LG (def.graphe) : règle et tableau sur l'écran
   OSC.defLG(o)     définition de graphique LG (type 'periode') pour mesurer à la règle sur cet écran
   OSC.f(o)         fonction u(t) du signal (t en ms, u en V)
   OSC.CADRE        { x0, x1, yTop, yBot } : l'écran en mm papier ; OSC.CAR = 12 (mm par carreau)

   OSC.question(zones, sit, o) : mesurer T sur l'écran, méthode au choix
     zones = { figure, champs } (deux zones de la page ; la même peut servir deux fois)
     sit   = { signal, baseTemps, sensibilite }
     o     = { methode: 'directe' | 'regle', bases: [..] (réglage de la base de temps, facultatif),
               onBase(b), onFini(T, info), onErreur(), onPhase(nom) ('compte' réussi…) }
     Lecture directe : curseurs sur deux points qui se correspondent, nombre de carreaux, n, puis
     T = (nombre de carreaux × base de temps) / n. Refusée (sans erreur) si la mesure n'est pas nette
     (n périodes ne font pas un nombre exact de dixièmes de carreau).
     Règle et tableau : LG.poserQuestion sur l'écran (ligne de l'échelle : carreaux ↔ durée).
     → { ecran, afficherEcran(), activerBase(oui), methode() }
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const X0 = 30, Y0 = 8, CAR = 12, NX = 10, NY = 8;     // écran : 10 × 8 carreaux de 12 mm
  const CADRE = { x0: X0, x1: X0 + NX * CAR, yTop: Y0, yBot: Y0 + NY * CAR };
  const fmt = (v, d) => PF.fmt(v, d);

  // fonction u(t) du signal (t en ms)
  function f(o) {
    const s = o.signal, g = LG.FORMES[s.forme] || LG.FORMES.sinus;
    return t => (s.decal || 0) + s.ampl * g((t - (s.phase || 0)) / s.periode, s);
  }
  const xDe = c => X0 + c * CAR;                                // abscisse d'une position en carreaux

  /* ---------- Dessin de l'écran ---------- */
  function dessin(o) {
    const b = o.baseTemps, sv = o.sensibilite, u = f(o);
    let h = `<rect x="${X0 - 3}" y="${Y0 - 3}" width="${NX * CAR + 6}" height="${NY * CAR + 6}" rx="2.5" fill="var(--paper)" stroke="var(--ink)" stroke-width=".9"/>`;
    // quadrillage pointillé
    // (trait --ink-3 très léger : le --paper-3 seul ne se voit pas sur le fond --paper, or il faut compter les carreaux)
    for (let i = 1; i < NX; i++) if (i !== NX / 2) h += `<line x1="${xDe(i)}" y1="${Y0}" x2="${xDe(i)}" y2="${Y0 + NY * CAR}" stroke="var(--ink-3)" stroke-opacity=".45" stroke-width=".4" stroke-dasharray=".9,1.1"/>`;
    for (let j = 1; j < NY; j++) if (j !== NY / 2) h += `<line x1="${X0}" y1="${Y0 + j * CAR}" x2="${X0 + NX * CAR}" y2="${Y0 + j * CAR}" stroke="var(--ink-3)" stroke-opacity=".45" stroke-width=".4" stroke-dasharray=".9,1.1"/>`;
    // axes centraux gradués en cinquièmes de carreau
    const xc = xDe(NX / 2), yc = Y0 + NY / 2 * CAR;
    h += `<line x1="${X0}" y1="${yc}" x2="${X0 + NX * CAR}" y2="${yc}" stroke="var(--ink-3)" stroke-width=".4"/>`;
    h += `<line x1="${xc}" y1="${Y0}" x2="${xc}" y2="${Y0 + NY * CAR}" stroke="var(--ink-3)" stroke-width=".4"/>`;
    for (let k = 1; k < NX * 5; k++) { const x = X0 + k * CAR / 5, l = k % 5 ? 1 : 1.8; h += `<line x1="${x}" y1="${yc - l}" x2="${x}" y2="${yc + l}" stroke="var(--ink-3)" stroke-width=".35"/>`; }
    for (let k = 1; k < NY * 5; k++) { const y = Y0 + k * CAR / 5, l = k % 5 ? 1 : 1.8; h += `<line x1="${xc - l}" y1="${y}" x2="${xc + l}" y2="${y}" stroke="var(--ink-3)" stroke-width=".35"/>`; }
    // trace
    let d = '';
    for (let i = 0; i <= 800; i++) {
      const t = NX * b * i / 800, y = Math.max(Y0, Math.min(Y0 + NY * CAR, yc - u(t) / sv * CAR));
      d += (i ? 'L' : 'M') + (X0 + NX * CAR * i / 800).toFixed(2) + ',' + y.toFixed(2);
    }
    h += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width=".9" stroke-linejoin="round"/>`;
    // réglages affichés sous l'écran, comme sur l'appareil
    h += `<text x="${X0 - 2}" y="${Y0 + NY * CAR + 7}" font-size="3.3" font-weight="700" fill="var(--ink-2)">Base de temps : ${fmt(b)} ms/carreau</text>`;
    h += `<text x="${X0 + NX * CAR + 2}" y="${Y0 + NY * CAR + 7}" font-size="3.3" font-weight="700" fill="var(--ink-2)" text-anchor="end">Sensibilité verticale : ${fmt(sv)} V/carreau</text>`;
    return h;
  }
  const graphe = o => () => dessin(o);

  /* ---------- Définition LG : mesurer à la règle sur l'écran ---------- */
  function defLG(o) {
    const b = o.baseTemps, sv = o.sensibilite;
    return {
      type: 'periode', caseNT: true,
      grandeur: { symbole: 'T', nom: 'période', noms: 'périodes' },
      cadre: CADRE,
      axeX: { min: 0, max: NX * b, pas: b, nom: 't', unite: 'ms', libelle: 't' },
      axeY: { min: -NY / 2 * sv, max: NY / 2 * sv, pas: sv, nom: 'u', unite: 'V' },
      signal: o.signal,
      graphe: graphe(o),
      unites: ['cm', 'mm', 'ms', 'V', 's'],
      unitesCalcul: ['cm', 'ms', 'V', 'ms/cm', 'cm/ms'],
    };
  }

  /* ============================================================
     ÉCRAN INTERACTIF
     ============================================================ */
  function monter(zone, o) {
    o = Object.assign({}, o);
    const box = document.createElement('div');
    box.className = 'osc';
    box.innerHTML = `<svg class="osc-svg" viewBox="24 0 132 112" xmlns="${NS}" role="img" aria-label="Écran d'oscilloscope : 10 carreaux en largeur, 8 en hauteur">
      <g class="osc-ecran"></g><g class="osc-motif" pointer-events="none"></g><g class="osc-curs"></g></svg>`;
    zone.appendChild(box);
    const svg = box.querySelector('svg'), gE = svg.querySelector('.osc-ecran'), gM = svg.querySelector('.osc-motif'), gC = svg.querySelector('.osc-curs');
    const st = { c: [1, 9], sel: 0, verrou: false, drag: null };

    function peindre() { gE.innerHTML = dessin(o); }
    function peindreCurseurs() {
      if (!o.curseurs) { gC.innerHTML = ''; return; }
      gC.innerHTML = st.c.map((c, i) => {
        const x = xDe(c), choisi = i === st.sel && !st.verrou;
        const coul = choisi ? 'var(--accent-ink)' : 'var(--ink-2)';
        return `<g class="osc-curseur" data-i="${i}">
          <line x1="${x}" y1="${Y0 - 2}" x2="${x}" y2="${Y0 + NY * CAR}" stroke="${coul}" stroke-width="${choisi ? .7 : .5}"/>
          <rect x="${x - 3.6}" y="0.4" width="7.2" height="6.2" rx="1.6" fill="${choisi ? 'var(--accent)' : 'var(--ink-2)'}"/>
          <text x="${x}" y="5" font-size="4.2" font-weight="800" text-anchor="middle" fill="#fff">${i + 1}</text>
          <rect class="osc-poignee" x="${x - 7}" y="0" width="14" height="${Y0 + NY * CAR}" fill="transparent"/></g>`;
      }).join('');
      gC.querySelectorAll('.osc-poignee').forEach(r => {
        const i = +r.parentNode.dataset.i;
        r.addEventListener('pointerdown', e => debut(e, i));
        r.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        r.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
      });
    }
    function changer() { peindreCurseurs(); if (o.onChange) o.onChange({ c1: st.c[0], c2: st.c[1], sel: st.sel }); }
    const enCarreaux = e => { const m = svg.getScreenCTM(); return ((e.clientX - m.e) / m.a - X0) / CAR; };
    const caler = c => Math.max(0, Math.min(NX, Math.round(c * 10) / 10));
    function debut(e, i) {
      if (st.verrou || st.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      st.sel = i; st.drag = { pid: e.pointerId };
      changer();
    }
    function bouger(e) {
      if (!st.drag || e.pointerId !== st.drag.pid) return;
      e.preventDefault();
      const c = caler(enCarreaux(e));
      if (c !== st.c[st.sel]) { st.c[st.sel] = c; changer(); }
    }
    function fin(e) { if (st.drag && e.pointerId === st.drag.pid) st.drag = null; }
    window.addEventListener('pointermove', bouger, { passive: false });
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);

    peindre(); peindreCurseurs();
    return {
      svg,
      maj(n) { Object.assign(o, n); peindre(); },
      etat: () => o,
      curseurs: () => st.c.slice().sort((a, b) => a - b),
      choisir(i) { if (st.verrou) return; st.sel = i; changer(); },
      deplacer(s) { if (st.verrou) return; st.c[st.sel] = caler(st.c[st.sel] + s * 0.1); changer(); },
      poser(a, b) { st.c = [caler(a), caler(b)]; changer(); },
      verrouiller() { st.verrou = true; peindreCurseurs(); },
      deverrouiller() { st.verrou = false; peindreCurseurs(); },
      // morceau de trace surligné entre deux positions (carreaux) et double flèche au-dessus
      surligner(a, b, texte) {
        const u = f(o), yc = Y0 + NY / 2 * CAR;
        let d = '', yMin = Infinity;
        for (let i = 0; i <= 240; i++) {
          const c = a + (b - a) * i / 240, y = Math.max(Y0, Math.min(Y0 + NY * CAR, yc - u(c * o.baseTemps) / o.sensibilite * CAR));
          yMin = Math.min(yMin, y);
          d += (i ? 'L' : 'M') + xDe(c).toFixed(2) + ',' + y.toFixed(2);
        }
        const x1 = xDe(a), x2 = xDe(b), yF = Math.max(Y0 + 6, yMin - 4);
        const pointe = (x, s) => `M${x},${yF} l${s * 2.2},-1.2 v2.4z`;
        const w = texte ? texte.replace(/<[^>]+>/g, '').length * 2.6 + 3 : 0;
        gM.innerHTML = `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-opacity=".35" stroke-linecap="round"/>
          <line x1="${x1 + 1}" y1="${yF}" x2="${x2 - 1}" y2="${yF}" stroke="var(--accent-ink)" stroke-width=".6"/>
          <path d="${pointe(x1, 1)} ${pointe(x2, -1)}" fill="var(--accent-ink)"/>
          ${texte ? `<rect x="${(x1 + x2) / 2 - w / 2}" y="${yF - 5.6}" width="${w}" height="5" rx="1" fill="var(--paper)"/>
          <text x="${(x1 + x2) / 2}" y="${yF - 1.7}" font-size="4.2" font-weight="800" text-anchor="middle" fill="var(--accent-ink)">${texte}</text>` : ''}`;
      },
      effacerMotif() { gM.innerHTML = ''; },
      detruire() {
        window.removeEventListener('pointermove', bouger);
        window.removeEventListener('pointerup', fin);
        window.removeEventListener('pointercancel', fin);
      },
    };
  }

  /* ============================================================
     MESURER T SUR L'ÉCRAN (méthode au choix)
     ============================================================ */
  const ORD = ['premier', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'septième', 'huitième', 'neuvième', 'dixième', 'onzième'];
  let nQ = 0;
  function question(zones, sit, o) {
    o = o || {};
    const id = 'osc' + (++nQ) + '_';
    const S = Object.assign({}, sit);
    let methode = o.methode === 'regle' ? 'regle' : 'directe', fini = false, phase = 'compte', resCompte = null;
    const zF = zones.figure, zC = zones.champs;

    // choix de la méthode, puis l'écran (lecture directe) ou la règle et le tableau
    const bloc = document.createElement('div');
    bloc.className = 'osc-q';
    bloc.innerHTML = `<div class="lg-methode" role="radiogroup" aria-label="Méthode de mesure"><span class="lg-methode-t">Méthode de mesure :</span>
        <button type="button" role="radio" class="lg-meth" data-m="directe" aria-checked="false">Comptage des carreaux</button>
        <button type="button" role="radio" class="lg-meth" data-m="regle" aria-checked="false">Règle et tableau de proportionnalité</button></div>
      <div data-a="direct">
        <p class="lg-aide-regle">Fais glisser les <b>curseurs</b> 1 et 2 (par leur étiquette ou leur trait), ou choisis-en un puis règle-le avec ◀ ▶ (un dixième de carreau).</p>
        <div data-a="ecran"></div>
        <div class="osc-cmd">
          <div class="osc-cmd-g" role="group" aria-label="Curseur à régler">
            <button type="button" class="btn-secondary osc-cur-b" data-c="0" aria-pressed="true">Curseur 1</button>
            <button type="button" class="btn-secondary osc-cur-b" data-c="1" aria-pressed="false">Curseur 2</button>
          </div>
          <div class="osc-cmd-g">
            <button type="button" class="btn-secondary osc-fl" data-a="moins" aria-label="Déplacer le curseur vers la gauche">◀</button>
            <button type="button" class="btn-secondary osc-fl" data-a="plus" aria-label="Déplacer le curseur vers la droite">▶</button>
          </div>
        </div>
        ${o.bases ? `<div class="osc-base" data-a="base">
            <span class="osc-base-t">Base de temps</span>
            <button type="button" class="btn-secondary osc-fl" data-a="bMoins" aria-label="Base de temps plus petite">−</button>
            <select class="osc-select" data-a="bSel" aria-label="Base de temps">${o.bases.map(b => `<option value="${b}">${fmt(b)} ms/carreau</option>`).join('')}</select>
            <button type="button" class="btn-secondary osc-fl" data-a="bPlus" aria-label="Base de temps plus grande">+</button>
          </div>` : ''}
      </div>
      <div data-a="regle" hidden></div>`;
    zF.appendChild(bloc);
    const $ = a => bloc.querySelector(`[data-a="${a}"]`);
    const ecran = monter($('ecran'), { signal: S.signal, baseTemps: S.baseTemps, sensibilite: S.sensibilite, curseurs: true,
      onChange(e) { majCur(e.sel); if (phase === 'compte' && refs.msg) refs.msg.innerHTML = ''; } });
    function majCur(sel) { bloc.querySelectorAll('.osc-cur-b').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.c === sel))); }
    bloc.querySelectorAll('.osc-cur-b').forEach(b => { b.onclick = () => ecran.choisir(+b.dataset.c); });
    $('moins').onclick = () => ecran.deplacer(-1);
    $('plus').onclick = () => ecran.deplacer(1);

    // réglage de la base de temps (− / sélecteur / +)
    let baseActive = true;
    if (o.bases) {
      const sel = $('bSel');
      sel.value = String(S.baseTemps);
      const regler = b => {
        if (!baseActive || b === S.baseTemps) return;
        S.baseTemps = b; sel.value = String(b);
        ecran.maj({ baseTemps: b }); ecran.effacerMotif();
        if (o.onBase) o.onBase(b);
      };
      sel.onchange = () => regler(+sel.value);
      $('bMoins').onclick = () => { const i = o.bases.indexOf(S.baseTemps); if (i > 0) regler(o.bases[i - 1]); };
      $('bPlus').onclick = () => { const i = o.bases.indexOf(S.baseTemps); if (i < o.bases.length - 1) regler(o.bases[i + 1]); };
    }

    // champs de la lecture directe (zone des champs)
    const champ = (k, lab, unite, ph, entier) => `<label class="osc-dl"><span class="osc-dl-l">${lab}</span><span class="osc-dl-in"><input type="text" id="${id + k}" class="ph-champ osc-champ" inputmode="${entier ? 'numeric' : 'decimal'}" autocomplete="off" spellcheck="false" placeholder="${ph}"><span class="lg-dl-u">${unite}</span></span></label>`;
    const champs = document.createElement('div');
    champs.className = 'osc-champs';
    champs.innerHTML = `<div data-a="pCompte">
        ${champ('car', 'Nombre de carreaux entre les curseurs :', 'carreaux', '')}
        ${champ('n', 'Nombre de périodes entre les curseurs : n =', 'périodes', '', true)}
        <div class="er-actions"><button type="button" class="btn-primary" data-a="vCompte">Vérifier</button></div></div>
      <div data-a="pT" hidden>
        <p class="osc-rappel" data-a="rappel"></p>
        ${champ('T', 'T = (nombre de carreaux × base de temps) / n =', 'ms', '')}
        <div class="er-actions"><button type="button" class="btn-primary" data-a="vT">Vérifier</button></div></div>
      <div data-a="msg" aria-live="polite"></div>`;
    zC.appendChild(champs);
    // références gardées : la page peut déplacer ces éléments (déroulé guidé du module 3)
    const refs = {};
    champs.querySelectorAll('[data-a]').forEach(e => { refs[e.dataset.a] = e; });
    champs.querySelectorAll('input').forEach(e => { refs['#' + e.id] = e; });
    const c$ = a => refs[a];
    const inp = k => refs['#' + id + k];
    ['car', 'n', 'T'].forEach(k => {
      inp(k).addEventListener('input', () => inp(k).classList.remove('is-ok', 'is-ko'));
      inp(k).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); (k === 'T' ? verifierT : verifierCompte)(); } });
    });
    const msg = h => { c$('msg').innerHTML = h; };
    const info = t => `<div class="callout pf-info"><p>${t}</p></div>`;
    const ko = l => `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${l.join(' ')}</p></div>`;
    const marque = (k, ok) => { inp(k).classList.toggle('is-ok', ok); inp(k).classList.toggle('is-ko', !ok); };
    const erreur = l => { msg(ko(l)); if (o.onErreur) o.onErreur(); };

    /* Étape « compter » : curseurs sur deux points qui se correspondent, carreaux, n */
    function verifierCompte() {
      if (fini || phase !== 'compte') return;
      const [a, b] = ecran.curseurs(), c = +(b - a).toFixed(1), base = S.baseTemps, T = S.signal.periode;
      const q1 = T / base, k = Math.round(c / q1);
      if (k < 1 || Math.abs(c - k * q1) > 0.06) {
        erreur(['Les deux curseurs ne sont pas sur deux points qui se correspondent : place-les sur deux sommets (ou deux creux), une ou plusieurs périodes plus loin.']);
        return;
      }
      // mesure nette ? n périodes = un nombre exact de dixièmes de carreau, curseurs posés dessus
      const q = k * q1;
      if (Math.abs(q * 10 - Math.round(q * 10)) > 0.05 || Math.abs(c - q) > 0.02) {
        msg(info('En lecture directe, cette valeur n\'est pas assez précise : utilise la règle et le tableau de proportionnalité.'
          + '<br><button type="button" class="btn-small lg-vers-regle">Utiliser la règle et le tableau</button>'));
        refs.msg.querySelector('.lg-vers-regle').onclick = () => choisir('regle');
        return;
      }
      const vc = PF.lire(inp('car').value), vn = PF.lire(inp('n').value);
      if (isNaN(vc) || isNaN(vn)) { msg(info('Écris un nombre dans chaque case (avec une virgule si besoin).')); return; }
      const err = [];
      const okC = Math.abs(vc - c) < 0.011;
      marque('car', okC);
      if (!okC) err.push('Compte les carreaux entre les deux curseurs, au dixième près : sur l\'axe central, un petit trait vaut 0,2 carreau.');
      const okN = vn === k;
      marque('n', okN);
      if (!okN) err.push(vn === k + 1 && ORD[k] ? `Entre le premier et le ${ORD[k]} sommet, il y a ${k} périodes, pas ${k + 1}.` : 'n : compte les motifs entiers entre les deux curseurs.');
      if (err.length) { erreur(err); return; }
      phase = 'T';
      resCompte = { c, n: k, base };
      ['car', 'n'].forEach(x => { inp(x).disabled = true; });
      c$('vCompte').disabled = true;
      ecran.surligner(a, b, (k > 1 ? k : '') + 'T');
      ecran.verrouiller();
      // le plus grand nombre de périodes lisible sur l'écran
      const kMax = Math.floor(NX / q1 + 1e-9);
      c$('rappel').innerHTML = `${k > 1 ? `${k} périodes` : 'Une période'} : ${fmt(c)} carreaux. Base de temps : ${fmt(base)} ms/carreau ; sensibilité verticale : ${fmt(S.sensibilite)} V/carreau.`;
      msg(`<p class="ph-ok">✓ Comptage juste.</p>${k < kMax ? info(`Tu pouvais mesurer ${kMax} périodes sur l'écran : plus il y a de périodes, plus la mesure est précise.`) : ''}`);
      c$('pT').hidden = false;
      if (o.onPhase) o.onPhase('compte');
      if (PF.surOrdi()) inp('T').focus({ preventScroll: true });
    }
    /* Étape « T » : T = (nombre de carreaux × base de temps) / n */
    function verifierT() {
      if (fini || phase !== 'T') return;
      const v = PF.lire(inp('T').value);
      if (isNaN(v)) { msg(info('Écris un nombre (avec une virgule si besoin).')); return; }
      const { c, n, base } = resCompte, T = c * base / n, sv = S.sensibilite, p = (a, b) => Math.abs(a - b) <= 0.01 * Math.abs(b);
      const ok = p(v, T);
      marque('T', ok);
      if (!ok) {
        // erreurs reconnues ; si une valeur correspond à plusieurs erreurs, les messages sont réunis
        const d = [];
        if (p(v, c / n) || p(v, c)) d.push('Tu as donné des carreaux, pas une durée : multiplie le nombre de carreaux par la base de temps (ms/carreau).');
        if (p(v, c * sv / n) || p(v, c * sv)) d.push('Tu as multiplié par la sensibilité verticale (V/carreau) : pour une durée, on utilise la base de temps (ms/carreau).');
        if (n > 1 && p(v, c * base)) d.push(`Tu as la durée de ${n} périodes : divise par n = ${n}.`);
        if (!d.length && (p(v, c / base / n) || p(v, c / base))) d.push('On multiplie le nombre de carreaux par la base de temps, on ne divise pas.');
        if (d.length > 1) erreur(['T = (nombre de carreaux × base de temps) / n : vérifie les deux points suivants.', ...d.map(x => '<br>· ' + x)]);
        else erreur([d[0] || 'T = (nombre de carreaux × base de temps) / n.']);
        return;
      }
      fini = true;
      inp('T').disabled = true; c$('vT').disabled = true;
      bloc.querySelectorAll('.lg-meth').forEach(b => { b.disabled = true; });
      msg(`<p class="ph-ok">✓ T = (${fmt(c)} × ${fmt(base)}) / ${n} = ${fmt(+T.toPrecision(3))} ms</p>`);
      if (o.onFini) o.onFini(T, { methode: 'directe', n, carreaux: c, base });
    }
    c$('vCompte').onclick = verifierCompte;
    c$('vT').onclick = verifierT;

    // règle et tableau : LG sur l'écran (construit au premier choix)
    let lg = null;
    function choisir(m) {
      if (fini) return;
      methode = m;
      bloc.querySelectorAll('.lg-meth').forEach(b => b.setAttribute('aria-checked', String(b.dataset.m === m)));
      $('direct').hidden = m !== 'directe';
      $('regle').hidden = m !== 'regle';
      champs.hidden = m !== 'directe';
      if (m === 'regle' && !lg) {
        lg = LG.poserQuestion($('regle'), defLG(S), {
          boutonSuivant: false, boutonPasser: false, sansPoints: true,
          onErreur() { if (o.onErreur) o.onErreur(); },
          onFini(tot, max, inf) {
            fini = true;
            bloc.querySelectorAll('.lg-meth').forEach(b => { b.disabled = true; });
            if (o.onFini) o.onFini(inf.valeur, { methode: 'regle', n: inf.n, base: S.baseTemps });
          },
        });
      }
    }
    bloc.querySelectorAll('.lg-meth').forEach(b => { b.onclick = () => choisir(b.dataset.m); });
    choisir(methode);

    return {
      ecran,
      methode: () => methode,
      // après une mesure à la règle : l'écran revient (changement de base de temps)
      afficherEcran() { $('regle').hidden = true; $('direct').hidden = false; champs.hidden = true; },
      activerBase(oui) {
        baseActive = oui;
        if (o.bases) bloc.querySelectorAll('[data-a="base"] button, [data-a="base"] select').forEach(e => { e.disabled = !oui; });
      },
      // réponse affichée : curseurs posés sur la mesure attendue
      montrer() {
        fini = true;
        const q1 = S.signal.periode / S.baseTemps, k = Math.max(1, Math.floor((NX - 0.05) / q1));
        const g = LG.FORMES[S.signal.forme] || LG.FORMES.sinus;
        let uM = 0, best = -Infinity;
        for (let i = 0; i < 1000; i++) { const v = g(i / 1000); if (v > best) { best = v; uM = i / 1000; } }
        let t0 = (S.signal.phase || 0) + uM * S.signal.periode;
        while (t0 - S.signal.periode >= 0) t0 -= S.signal.periode;
        while (t0 < 0) t0 += S.signal.periode;
        const a = t0 / S.baseTemps;
        choisir('directe');
        ecran.deverrouiller();
        ecran.poser(a, a + k * q1);
        ecran.surligner(a, a + k * q1, (k > 1 ? k : '') + 'T');
        ecran.verrouiller();
        champs.hidden = true;
      },
    };
  }

  window.OSC = { monter, dessin, graphe, defLG, f, question, CADRE, CAR };
})();
