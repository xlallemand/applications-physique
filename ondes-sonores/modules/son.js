/* ============================================================
   Sons, notes et instruments (objet global SON) de l'application
   « Chapitre 18 : Ondes sonores ». À charger après assets/fourier.js
   (même moteur que le simulateur du chapitre 17).

   SON.NOTES                      gamme de do₃ à ré₅ (la₃ = 440 Hz) : [{ id, nom (HTML), texte, f, diese }]
   SON.note(id)                   une note de la gamme ; SON.noteDe(f) : la note la plus proche d'une fréquence
   SON.INSTRUMENTS                spectres simplifiés (amplitudes a₁, a₂… en V) : diapason, flûte,
                                  violon, clarinette, orgue, guitare
   SON.instrumentDe(a)            identifiant de l'instrument dont le spectre est a (ou null)
   SON.nature(a)                  'pur' (une seule raie), 'complexe' (plusieurs raies) ou 'muet'
   SON.jouer(spec, volume)        joue le son (Web Audio, createPeriodicWave : sinus de phase nulle
                                  d'amplitudes aₙ) pendant 1,5 s, avec fondu d'entrée et de sortie ;
                                  volume de 0 à 1, plafonné ; renvoie false si l'audio est indisponible
   SON.disponible()               l'audio peut-il fonctionner dans ce navigateur ?
   SON.bouton(spec, libelle)      bouton « ▶ Écouter » en HTML (à placer dans un énoncé, une fiche…)
   SON.monter(zone, opts)         simulateur musical : FOURIER.monter (signal au-dessus, spectre en
                                  dessous, raies réglables) habillé d'un clavier (do₃ à ré₅) ou d'une
                                  fréquence libre, de préréglages d'instruments, d'un bouton « Écouter »
                                  avec volume, et des mots « hauteur (note) », « timbre », « son pur »,
                                  « son complexe ». Plusieurs exemplaires possibles.
       opts = { note ('la3'), libre (bool), f1, instrument ('diapason'), a, fmax, mesure, cases,
                clavier (true), instruments (true), N (8 harmoniques), tmax (10 ms), amax (2 V), aria }
       → { el, fourier, etat(), regler(r, silencieux), surChange(f), jouer() }
       etat() = { f1, a, note, libre, instrument, nature, ecoutes: [{ note, f1, instrument, a }], mesure, t1, t2, fmax }
       regler accepte note, libre, f1, instrument, a, et les réglages de FOURIER (fmax, mesure, cible…)
   SON.air(zone, opts)            animation de l'air entre un haut-parleur et une oreille : points
                                  qui oscillent autour de leur position, compressions (C) et
                                  dilatations (D) qui avancent ; boutons « Pause / Animer » et
                                  « Pas à pas » (seul celui-ci si prefers-reduced-motion).
                                  Plusieurs exemplaires possibles. → { el, temps(), avancer() }
   ============================================================ */
(function () {
  'use strict';

  const F = () => window.FOURIER;
  const fmt = (v, d) => F().fmt(v, d);
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ============================================================
     NOTES : gamme tempérée, la₃ = 440 Hz (notation française : do₃ = 262 Hz) ;
     les fréquences sont celles des manuels (La₄ 880 Hz, Si₄ 988 Hz,
     Do₅ 1 046 Hz, Ré₅ 1 174 Hz : données de l'exercice 8)
     ============================================================ */
  const NOMS = [['do', ''], ['do', '♯'], ['ré', ''], ['ré', '♯'], ['mi', ''], ['fa', ''], ['fa', '♯'], ['sol', ''], ['sol', '♯'], ['la', ''], ['la', '♯'], ['si', '']];
  const FREQ = [262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494, 523, 554, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988, 1046, 1109, 1174];
  const NOTES = FREQ.map((f, k) => {
    const [n, d] = NOMS[k % 12], oct = 3 + Math.floor(k / 12);
    return { id: (n === 'ré' ? 're' : n) + (d ? 'd' : '') + oct, nom: `${n}${d}<sub>${oct}</sub>`, texte: `${n}${d ? ' dièse' : ''} ${oct}`, f, diese: !!d };
  });
  const note = id => NOTES.find(n => n.id === id) || null;
  const noteDe = f => NOTES.reduce((b, n) => (Math.abs(Math.log(n.f / f)) < Math.abs(Math.log(b.f / f)) ? n : b), NOTES[0]);

  /* ============================================================
     INSTRUMENTS : spectres simplifiés (amplitudes en V, comme le signal
     d'un micro), à présenter comme tels
     ============================================================ */
  const INSTRUMENTS = {
    diapason: { label: 'Diapason', a: [1.5], desc: 'son pur : une seule raie' },
    // flûte : rapports des raies du la₄ de l'exercice A (1 ; 0,30 ; 0,08)
    flute: { label: 'Flûte', a: [1.6, .48, .13], desc: 'fondamental fort, deux harmoniques faibles' },
    // violon : rapports des pics du sujet de bac (0,098 ; 0,139 ; 0,012 ; 0,014 ; 0,004 V)
    violon: { label: 'Violon', a: [1, 1.42, .12, .14, .04], desc: 'a<sub>2</sub> plus grand que a<sub>1</sub>, a<sub>3</sub> et a<sub>4</sub> faibles' },
    clarinette: { label: 'Clarinette', a: [1.5, .1, 1, .05, .6, .05, .35], desc: 'surtout les harmoniques impairs' },
    orgue: { label: 'Orgue', a: [1.4, 1.45], desc: 'fondamental et rang 2' },
    guitare: { label: 'Guitare', a: [1.2, 1.15, 0, 1.15, .25, 0, .3], desc: 'harmoniques jusqu\'au rang 7' },
  };
  const egalA = (a, b) => {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) if (Math.abs((+a[i] || 0) - (+b[i] || 0)) > .001) return false;
    return true;
  };
  const instrumentDe = a => Object.keys(INSTRUMENTS).find(k => egalA(a, INSTRUMENTS[k].a)) || null;
  const nbRaies = a => a.filter(v => v > 0).length;
  const nature = a => (nbRaies(a) === 0 ? 'muet' : nbRaies(a) === 1 ? 'pur' : 'complexe');

  /* ============================================================
     SON (Web Audio API) : démarré seulement par un geste de l'élève,
     fonctionne en file:// ; volume plafonné ; un seul son à la fois
     ============================================================ */
  const VOL_MAX = .3, DUREE = 1.5;
  let ctx = null, indispo = false, enCours = null;
  function contexte() {
    if (indispo) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { indispo = true; return null; }
        ctx = new AC();
      }
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      return ctx;
    } catch (e) { indispo = true; return null; }
  }
  const disponible = () => !indispo && !!(window.AudioContext || window.webkitAudioContext);
  function arreter() {
    if (!enCours) return;
    try { enCours.g.gain.cancelScheduledValues(ctx.currentTime); enCours.g.gain.setTargetAtTime(0, ctx.currentTime, .02); enCours.osc.stop(ctx.currentTime + .1); } catch (e) { /* déjà arrêté */ }
    enCours = null;
  }
  // spec = { f1, a: [a1, a2…] } ; volume de 0 à 1 ; renvoie true si le son est lancé
  function jouer(spec, volume) {
    const c = contexte();
    if (!c) return false;
    const a = (spec.a || []).map(v => +v || 0);
    if (!a.some(v => v > 0)) return true;                        // aucune raie : rien à jouer
    try {
      arreter();
      const re = new Float32Array(a.length + 1), im = new Float32Array(a.length + 1);
      a.forEach((v, i) => { im[i + 1] = v; });                    // sinus de phase nulle : coefficients des sinus
      const onde = c.createPeriodicWave(re, im);                  // forme normalisée (sommet à 1)
      // le volume suit l'amplitude du signal (4 V : plein volume), plafonné
      const e = F().extremes({ f1: spec.f1, a0: 0, a }), crete = Math.max(Math.abs(e.mn), Math.abs(e.mx));
      const v = VOL_MAX * Math.max(0, Math.min(1, volume == null ? .6 : volume)) * Math.min(1, crete / 4);
      const osc = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + .02;
      osc.setPeriodicWave(onde);
      osc.frequency.setValueAtTime(spec.f1, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(v, t0 + .06);               // fondu d'entrée
      g.gain.setValueAtTime(v, t0 + DUREE - .25);
      g.gain.linearRampToValueAtTime(0, t0 + DUREE);              // fondu de sortie
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + DUREE + .05);
      const moi = { osc, g };
      enCours = moi;
      osc.onended = () => { if (enCours === moi) enCours = null; };
      return true;
    } catch (err) { indispo = true; return false; }
  }
  const MSG_INDISPO = 'Le son n\'est pas disponible dans ce navigateur : le reste fonctionne normalement.';

  // bouton « ▶ Écouter » placé dans du HTML (énoncé, fiche) ; un clic joue le son décrit
  const bouton = (spec, libelle) => `<button type="button" class="btn-secondary son-ecouter" data-son='${JSON.stringify({ f1: spec.f1, a: spec.a })}'>▶ ${libelle || 'Écouter'}</button>`;
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.son-ecouter[data-son]');
    if (!b) return;
    let spec = null;
    try { spec = JSON.parse(b.dataset.son); } catch (err) { return; }
    const ok = jouer(spec, .6);
    const suite = b.nextElementSibling;
    if (!ok && !(suite && suite.classList.contains('son-msg'))) b.insertAdjacentHTML('afterend', `<span class="son-msg">${MSG_INDISPO}</span>`);
    b.classList.add('son-joue');
    setTimeout(() => b.classList.remove('son-joue'), DUREE * 1000);
  });

  /* ============================================================
     SIMULATEUR MUSICAL
     ============================================================ */
  let nSimu = 0;
  function monter(zone, opts) {
    const o = Object.assign({ note: 'la3', libre: false, instrument: 'diapason', clavier: true, instruments: true, N: 8, tmax: 10, cases: ['harmoniques', 'mesure'] }, opts);
    const id = 'son-' + (++nSimu);
    const n0 = note(o.note) || note('la3');
    const etat = {
      note: o.libre ? null : n0.id, libre: !!o.libre, volume: .6, ecoutes: [],
    };
    const f1Initial = o.f1 || (o.libre ? 440 : n0.f);
    const aInitial = o.a || (INSTRUMENTS[o.instrument] || INSTRUMENTS.diapason).a;
    const ecouteurs = [];
    const racine = el('div', 'son-simu');
    racine.innerHTML = `
      <div class="son-barre">
        <button type="button" class="btn-primary son-jouer" data-a="jouer">▶ Écouter</button>
        <label class="son-vol"><span>Volume</span><input type="range" min="0" max="100" step="5" value="60" data-a="vol" aria-label="Volume du son"></label>
        <p class="son-aide" data-a="aide">Le son dure 1,5 s. Rien entendu ? Monte le volume de l'appareil et coupe le mode silencieux.</p>
      </div>
      ${o.clavier ? `<div class="son-bloc">
        <div class="son-entete"><span class="fo-petit-t">Note jouée : hauteur</span>
          <span class="son-mode" role="group" aria-label="Choix de la fréquence">
            <button type="button" class="son-pill" data-mode="clavier" aria-pressed="true">Clavier</button>
            <button type="button" class="son-pill" data-mode="libre" aria-pressed="false">Fréquence libre</button></span></div>
        <div class="son-clavier-defile" data-a="clav"><div class="son-clavier" role="group" aria-label="Clavier de do 3 à ré 5 : touche une note pour la jouer">
          ${NOTES.filter(n => !n.diese).map(n => `<button type="button" class="son-blanche" data-note="${n.id}" aria-pressed="false" aria-label="${n.texte}, ${n.f} hertz"><span class="son-n">${n.nom}</span><span class="son-f">${n.f}</span></button>`).join('')}
          ${NOTES.map((n, k) => (n.diese ? `<button type="button" class="son-noire" data-note="${n.id}" aria-pressed="false" aria-label="${n.texte}, ${n.f} hertz" style="left:calc(${NOTES.slice(0, k).filter(x => !x.diese).length} * var(--son-touche) - var(--son-noire) / 2)"></button>` : '')).join('')}
        </div></div>
        <label class="fo-reglage son-libre" data-a="libre" hidden><span class="fo-reglage-nom">Fréquence du fondamental f<sub>1</sub> = <b data-a="vf1"></b></span>
          <input type="range" min="100" max="1500" step="5" data-a="f1" aria-label="Fréquence du fondamental f1, en hertz"></label>
      </div>` : ''}
      ${o.instruments ? `<div class="son-bloc">
        <div class="son-entete"><span class="fo-petit-t">Instrument : timbre</span><span class="son-note-simpl">spectres simplifiés</span></div>
        <div class="son-instr" role="group" aria-label="Instruments">${Object.keys(INSTRUMENTS).map(k => `<button type="button" class="son-pill son-pill-g" data-instr="${k}" aria-pressed="false">${INSTRUMENTS[k].label}</button>`).join('')}</div>
        <p class="son-instr-desc" data-a="idesc"></p>
      </div>` : ''}
      <div data-a="fourier"></div>`;
    zone.appendChild(racine);
    const $ = a => racine.querySelector(`[data-a="${a}"]`);
    const fo = F().monter($('fourier'), {
      N: o.N, f1: f1Initial, a0: 0, a: aInitial, amax: o.amax || 2, nom: 'u', unite: 'V', titreY: 'u(t) (en V) : signal du micro',
      predefinis: false, reglages: false, sansA0: true, cases: o.cases, tmax: o.tmax, fmax: o.fmax, mesure: o.mesure,
      aria: o.aria,
    });
    // bandeau au-dessus du spectre : hauteur (note), son pur ou complexe, timbre
    const bande = el('div', 'son-bande');
    bande.setAttribute('aria-live', 'polite');
    const blocSpectre = fo.el.querySelector('.fo-g-spectre').parentElement;
    blocSpectre.insertBefore(bande, blocSpectre.firstChild);

    const instr = () => instrumentDe(fo.etat().a);
    function copie() {
      const e = fo.etat();
      return { f1: e.f1, a: e.a.slice(), note: etat.note, libre: etat.libre, instrument: instr(), nature: nature(e.a),
        ecoutes: etat.ecoutes.map(x => Object.assign({}, x)), mesure: e.mesure, t1: e.t1, t2: e.t2, fmax: e.fmax, harmoniques: e.harmoniques };
    }
    function maj() {
      const e = fo.etat(), n = etat.note ? note(etat.note) : null, nat = nature(e.a), k = instr();
      const lib = { pur: 'son pur', complexe: 'son complexe', muet: 'aucun son' }[nat];
      bande.innerHTML = `<span class="son-b-h"><span class="son-b-t">Hauteur (note)</span> <b>${n ? n.nom : 'fréquence libre'}</b> · f<sub>1</sub> = <b>${fmt(e.f1)} Hz</b></span>
        <span class="son-b-nat${nat === 'pur' ? ' pur' : ''}">${lib}</span>
        <span class="son-b-h"><span class="son-b-t">Timbre</span> <b>${k ? INSTRUMENTS[k].label.toLowerCase() : 'réglage personnel'}</b></span>
        ${e.a[0] === 0 && nat !== 'muet' ? '<span class="son-b-att">a<sub>1</sub> = 0 : la raie la plus basse n\'est plus à f<sub>1</sub>, la note entendue change.</span>' : ''}`;
      racine.querySelectorAll('[data-note]').forEach(b => b.setAttribute('aria-pressed', String(!etat.libre && b.dataset.note === etat.note)));
      racine.querySelectorAll('[data-instr]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.instr === k)));
      racine.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mode === 'libre') === etat.libre)));
      const cl = $('clav'), li = $('libre');
      if (cl) {
        cl.hidden = etat.libre;
        // la touche jouée reste visible dans le clavier qui défile (petit écran), sans faire défiler la page
        const t = cl.querySelector('[aria-pressed="true"]');
        if (t && cl.scrollWidth > cl.clientWidth + 1 && t.dataset.note !== cl.dataset.vue) {
          cl.dataset.vue = t.dataset.note;
          const g = t.offsetLeft, d = g + t.offsetWidth;
          if (g < cl.scrollLeft || d > cl.scrollLeft + cl.clientWidth) cl.scrollLeft = Math.max(0, g - (cl.clientWidth - t.offsetWidth) / 2);
        }
      }
      if (li) { li.hidden = !etat.libre; $('f1').value = e.f1; $('vf1').textContent = `${fmt(e.f1)} Hz`; }
      const d = $('idesc');
      if (d) d.innerHTML = k ? `${INSTRUMENTS[k].label} : ${INSTRUMENTS[k].desc}. Tu peux ensuite modifier les raies et écouter.` : 'Réglage personnel : les raies ne correspondent à aucun préréglage.';
    }
    const signaler = () => { const e = copie(); ecouteurs.forEach(f => f(e)); };
    fo.surChange(() => { maj(); signaler(); });

    function lancer() {
      const e = fo.etat(), ok = jouer({ f1: e.f1, a: e.a }, etat.volume);
      etat.ecoutes.push({ note: etat.libre ? null : etat.note, f1: e.f1, instrument: instr(), a: e.a.slice() });
      const aide = $('aide');
      if (!ok) { aide.textContent = MSG_INDISPO; aide.classList.add('son-msg'); }
      const b = $('jouer');
      b.classList.add('son-joue');
      clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('son-joue'), DUREE * 1000);
      signaler();
    }
    function regler(r, silencieux) {
      r = Object.assign({}, r);
      if (r.libre != null) etat.libre = !!r.libre;
      if (r.note) { const n = note(r.note); if (n) { etat.note = n.id; etat.libre = false; r.f1 = n.f; } }
      else if (r.f1 != null && !etat.libre) { const n = NOTES.find(x => x.f === r.f1); if (n) etat.note = n.id; else { etat.libre = true; etat.note = null; } }
      if (r.libre && r.f1 == null) etat.note = null;
      if (r.instrument && INSTRUMENTS[r.instrument]) r.a = INSTRUMENTS[r.instrument].a;
      delete r.note; delete r.libre; delete r.instrument;
      fo.regler(r, true);
      maj();
      if (!silencieux) signaler();
    }
    // clavier : une touche choisit la note et la joue
    racine.querySelectorAll('[data-note]').forEach(b => {
      b.onclick = () => { regler({ note: b.dataset.note }, true); lancer(); };
    });
    racine.querySelectorAll('[data-mode]').forEach(b => {
      b.onclick = () => {
        const libre = b.dataset.mode === 'libre';
        if (libre === etat.libre) return;
        if (libre) regler({ libre: true });
        else regler({ note: noteDe(fo.etat().f1).id });
      };
    });
    const sF = $('f1');
    if (sF) sF.addEventListener('input', () => { etat.libre = true; etat.note = null; fo.regler({ f1: +sF.value }, true); maj(); signaler(); });
    racine.querySelectorAll('[data-instr]').forEach(b => {
      b.onclick = () => { regler({ instrument: b.dataset.instr }, true); lancer(); };
    });
    $('jouer').onclick = lancer;
    $('vol').addEventListener('input', () => { etat.volume = +$('vol').value / 100; });
    if (o.libre && o.f1) etat.note = null;
    if (!o.libre && o.f1 && !NOTES.find(x => x.f === o.f1)) { etat.libre = true; etat.note = null; }
    maj();
    racine.id = id;
    return { el: racine, fourier: fo, etat: copie, regler, surChange(f) { ecouteurs.push(f); }, jouer: lancer };
  }

  /* ============================================================
     ANIMATION DE L'AIR : rangée de points d'air entre un haut-parleur
     et une oreille ; chaque point oscille autour de sa position
     (x = x₀ + A sin(ωt − kx₀)) ; les zones de compression (C) et de
     dilatation (D) avancent vers l'oreille. Ralenti : une période en
     1,6 s. Un point mis en valeur et sa position de repos (pointillés).
     ============================================================ */
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function air(zone, opts) {
    const o = Object.assign({ suivi: true }, opts);
    const W = 600, H = 200, xa = 92, xb = 520, pas = 9, lam = 150, A = 10, T = 1.6, rangs = 6;
    const k = 2 * Math.PI / lam, w = 2 * Math.PI / T;
    const racine = el('div', 'son-air');
    const cols = [];
    for (let x = xa; x <= xb; x += pas) cols.push(x);
    const iSuivi = Math.round(cols.length * .42);
    const pts = [];
    let s = '';
    // haut-parleur (membrane mobile) et oreille
    s += '<path class="son-hp" d="M14,78 h26 l26,-30 v104 l-26,-30 h-26 z"/><line class="son-membrane" data-a="mb" x1="70" y1="52" x2="70" y2="148"/>';
    s += '<path class="son-oreille" d="M560,62 c22,0 30,18 30,36 c0,16 -10,22 -16,30 c-6,8 -4,18 -14,20 c-10,2 -16,-6 -16,-12 M562,84 c8,0 12,6 12,12 c0,6 -6,8 -8,12"/>';
    s += '<g data-a="zc"></g><g data-a="pts">';
    for (let r = 0; r < rangs; r++) {
      cols.forEach((x, i) => {
        const suivi = o.suivi && i === iSuivi && r === 2;
        s += `<circle class="${suivi ? 'son-pt-suivi' : 'son-pt'}" cx="${x}" cy="${52 + r * 19}" r="${suivi ? 5.5 : 3.2}"/>`;
      });
    }
    s += '</g>';
    if (o.suivi) s += `<line class="son-repos" x1="${cols[iSuivi]}" y1="38" x2="${cols[iSuivi]}" y2="160"/>`;
    s += '<g data-a="cd"></g>';
    s += `<text class="son-txt" x="40" y="186" text-anchor="middle">haut-parleur</text><text class="son-txt" x="566" y="186" text-anchor="middle">oreille</text>`;
    s += `<line class="son-sens" x1="250" y1="176" x2="360" y2="176"/><path class="son-sens-p" d="M368,176 l-9,-4.5 v9 z"/><text class="son-txt" x="305" y="194" text-anchor="middle">sens de propagation</text>`;
    racine.innerHTML = `<svg class="son-air-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Points d'air entre un haut-parleur et une oreille : chaque point oscille autour de sa position, les zones de compression et de dilatation avancent vers l'oreille">${s}</svg>
      <div class="son-air-l">
        <button type="button" class="btn-secondary" data-a="anim"${reduit() ? ' hidden' : ''}>⏸ Pause</button>
        <button type="button" class="btn-secondary" data-a="pas">Pas à pas ▸</button>
        <span class="son-air-leg"><span class="son-air-c">C</span> compression · <span class="son-air-c">D</span> dilatation${o.suivi ? ' · <span class="son-air-p"></span> un point d\'air suivi' : ''}</span>
      </div>`;
    zone.appendChild(racine);
    racine.querySelectorAll('[data-a="pts"] circle').forEach(c => pts.push({ c, x0: +c.getAttribute('cx') }));
    const mb = racine.querySelector('[data-a="mb"]'), cd = racine.querySelector('[data-a="cd"]'), zc = racine.querySelector('[data-a="zc"]');
    let t = T * .3, enMarche = !reduit(), raf = null, avant = null, visible = true;
    const depl = (x0, tt) => A * Math.sin(w * tt - k * x0);
    function dessiner() {
      pts.forEach(p => p.c.setAttribute('cx', (p.x0 + depl(p.x0, t)).toFixed(2)));
      mb.setAttribute('x1', 70 + depl(70, t) * .8); mb.setAttribute('x2', 70 + depl(70, t) * .8);
      // densité ∝ 1 − dx/dx₀ = 1 + Ak cos(ωt − kx₀) : compressions où ωt − kx₀ = 2πm
      // (les points voisins y sont le plus rapprochés) ; dilatations à mi-chemin
      let h = '', z = '';
      for (let m = -3; m <= 6; m++) {
        const xc = (w * t - 2 * Math.PI * m) / k, xd = xc - lam / 2;
        if (xc >= xa + 4 && xc <= xb - 4) { z += `<rect class="son-zone-c" x="${xc - 14}" y="40" width="28" height="118" rx="8"/>`; h += `<text class="son-cd" x="${xc}" y="32" text-anchor="middle">C</text>`; }
        if (xd >= xa + 4 && xd <= xb - 4) h += `<text class="son-cd son-cd-d" x="${xd}" y="32" text-anchor="middle">D</text>`;
      }
      cd.innerHTML = h; zc.innerHTML = z;                     // zones sous les points, lettres au-dessus
    }
    function boucle(ts) {
      if (avant != null) t += Math.min(.05, (ts - avant) / 1000);
      avant = ts;
      dessiner();
      raf = enMarche && visible ? requestAnimationFrame(boucle) : null;
      if (!raf) avant = null;
    }
    const demarrer = () => { if (!raf && enMarche && visible) raf = requestAnimationFrame(boucle); };
    const bA = racine.querySelector('[data-a="anim"]'), bP = racine.querySelector('[data-a="pas"]');
    bA.onclick = () => {
      enMarche = !enMarche;
      bA.textContent = enMarche ? '⏸ Pause' : '▶ Animer';
      if (enMarche) demarrer(); else if (raf) { cancelAnimationFrame(raf); raf = null; avant = null; }
    };
    // pas à pas : un huitième de période, animation arrêtée
    function avancer() {
      if (enMarche && !reduit()) { enMarche = false; bA.textContent = '▶ Animer'; if (raf) { cancelAnimationFrame(raf); raf = null; avant = null; } }
      t += T / 8; dessiner();
    }
    bP.onclick = avancer;
    // animation suspendue quand la figure n'est pas à l'écran
    if (window.IntersectionObserver) new IntersectionObserver(l => { visible = l.some(x => x.isIntersecting); demarrer(); }).observe(racine);
    dessiner();
    demarrer();
    return { el: racine, temps: () => t, avancer };
  }

  window.SON = { NOTES, note, noteDe, INSTRUMENTS, instrumentDe, nature, jouer, disponible, bouton, monter, air, MSG_INDISPO };
})();
