/* ============================================================
   Module 4 : entraînement (série de 10 questions notée sur 20)
   PF.questionsSerie() → 10 questions tirées dans quatre groupes :
     A. signal à l'axe gradué : T tombe sur des valeurs écrites (une ou plusieurs périodes), puis f ;
     B. signal « papier » à l'échelle : règle, tableau, n périodes, puis f ;
     C. oscilloscope : carreaux × base de temps, puis f ;
     D. T ↔ f : f à partir de T (ms, µs), T à partir de f (Hz, kHz).
   Dans A, B et C, la méthode de mesure est au choix (lecture directe ou règle et tableau),
   avec la même règle d'acceptation que dans les modules 2 et 3.
   ============================================================ */
(function () {
  'use strict';

  const fmt = PF.fmt, hasard = PF.hasard, el = PF.el;
  const AY = { min: -1.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'V' };
  const G = { symbole: 'T', nom: 'période', noms: 'périodes' };
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const SOURCES = {
    sinus: 'un microphone placé devant un diapason', triangle: 'un générateur de signaux (GBF)', clarinette: 'un microphone placé devant une clarinette',
    trompette: 'un microphone placé devant une trompette', carre: 'un générateur de signaux (GBF)', ecg: 'un électrocardiographe (activité du cœur)',
  };

  /* ---------- Partie « mesurer T » sur un graphique LG, suivie des parties de la fréquence ----------
     Les parties de la fréquence sont fabriquées une fois T connue (valeur de l'élève, ou réponse affichée). */
  function questionGraphique(def, o) {
    const u = def.axeX.unite, T = def.signal.periode;
    const nFreq = u === 's' ? 1 : 2;
    const q = { theme: o.theme, consigne: o.consigne, enonce: o.enonce, parties: [], def };   // def : utile pour vérifier l'application
    let Tval = null;
    const remplirFrequence = v => {
      const pf = PF.partiesFrequence({ T: +v.toPrecision(3), unite: u, exact: T });
      for (let i = 0; i < nFreq; i++) q.parties[1 + i] = pf[i];
    };
    q.parties.push({
      type: 'perso',
      q: 'Détermine la période T du signal (méthode au choix).',
      monter(zone, api) {
        const lg = LG.poserQuestion(zone, def, {
          choixMethode: true, methode: o.methode, frequence: true,
          boutonSuivant: false, boutonPasser: false, sansPoints: true,
          onErreur() { api.compter(); },
          onFini(tot, max, info) { Tval = info.valeur; remplirFrequence(info.valeur); api.reussi(true); },
        });
        return {
          montrer() {
            lg.detruire();
            Tval = T; remplirFrequence(T);
            zone.innerHTML = `${LG.figure(def, [], false)}<p class="pf-corr">${o.correction}</p>`;
          },
        };
      },
    });
    for (let i = 0; i < nFreq; i++) q.parties.push(null);         // remplacées une fois T connue
    q.bilan = o.bilan;
    return q;
  }

  /* ---------- A. Signal à l'axe gradué : n périodes tombent sur des valeurs écrites ---------- */
  function axeGradue() {
    const cas = hasard([
      { T: 4, pas: 2 }, { T: 5, pas: 1 }, { T: 2.5, pas: 2 }, { T: 1.5, pas: 1 }, { T: 6, pas: 2 },
      { T: 0.4, pas: 0.2 }, { T: 20, pas: 10 }, { T: 0.8, pas: 0.5, unite: 's', forme: 'ecg' }, { T: 2.4, pas: 2 },
    ]);
    const forme = cas.forme || hasard(['sinus', 'triangle', 'clarinette', 'trompette']);
    // plus petit nombre de périodes qui tombe sur une graduation écrite
    let nB = 1;
    while (Math.abs(nB * cas.T / cas.pas - Math.round(nB * cas.T / cas.pas)) > 1e-9) nB++;
    const g0 = cas.pas * entre(1, 2), max = cas.pas * Math.ceil((g0 + Math.max(nB, 3) * cas.T + 0.4 * cas.T) / cas.pas);
    const unite = cas.unite || 'ms';
    const def = {
      type: 'periode', caseNT: true, grandeur: G,
      axeX: { min: 0, max, pas: cas.pas, nom: 't', unite, libelle: 't' },
      axeY: forme === 'ecg' ? { min: -0.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'mV' } : AY,
      signal: { forme, periode: cas.T, ampl: forme === 'ecg' ? 1.2 : 1.1, phase: PF.phaseSommet(forme, cas.T, g0) },
      unites: ['cm', 'mm', unite, unite === 's' ? 'ms' : 's', forme === 'ecg' ? 'mV' : 'V'],
    };
    const f = 1 / (cas.T * (unite === 's' ? 1 : 1e-3));
    return questionGraphique(def, {
      theme: 'Signal à l\'axe gradué', methode: 'directe',
      consigne: 'Détermine la période T, puis la fréquence f du signal.',
      enonce: `<p>Tension délivrée par ${SOURCES[forme]}.</p>`,
      correction: `${nB > 1 ? `${nB} périodes tombent sur des graduations écrites : ${nB}T = ${fmt(nB * cas.T)} ${unite}, donc T = ${fmt(nB * cas.T)} / ${nB} = ` : 'Une période tombe sur des graduations écrites : T = '}<b>${fmt(cas.T)} ${unite}</b>.`,
      bilan: `T = ${fmt(cas.T)} ${unite} et f = 1 / T ${PF.egal(f)} ${PF.court(f)} Hz.`,
    });
  }

  /* ---------- B. Signal « papier » à l'échelle : valeurs non lisibles directement ---------- */
  function papier() {
    const ecg = Math.random() < 0.2;
    const forme = ecg ? 'ecg' : hasard(['sinus', 'triangle', 'clarinette', 'trompette']);
    const unite = ecg ? 's' : 'ms', pas = ecg ? 0.5 : hasard([1, 2]);
    let T, max, ok = false;
    // période à trois chiffres significatifs, aucun nombre de périodes ne tombe sur une graduation
    while (!ok) {
      T = ecg ? entre(62, 110) / 100 : entre(160, 420) / 100;
      max = pas * Math.round(4.3 * T / pas);
      const mm = 154 / max, nLim = Math.floor(159 / (T * mm));
      ok = max >= 4 * pas;
      for (let n = 1; n <= nLim && ok; n++) {
        const q = n * T / pas;
        if (Math.abs(q - Math.round(q)) * pas * mm < 0.8) ok = false;
      }
    }
    const def = {
      type: 'periode', caseNT: true, grandeur: G,
      axeX: { min: 0, max, pas, nom: 't', unite, libelle: 't' },
      axeY: ecg ? { min: -0.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'mV' } : AY,
      signal: { forme, periode: T, ampl: ecg ? 1.2 : 1.1, phase: Math.random() * T * 0.5 },
      unites: ['cm', 'mm', unite, unite === 's' ? 'ms' : 's', ecg ? 'mV' : 'V'],
    };
    const R = LG.repere(def), A = LG.analyser(def, R), f = 1 / (T * (unite === 's' ? 1 : 1e-3));
    return questionGraphique(def, {
      theme: 'Signal à l\'échelle', methode: 'regle',
      consigne: 'Détermine la période T, puis la fréquence f du signal.',
      enonce: `<p>Tension délivrée par ${SOURCES[forme]}. Les périodes ne tombent pas sur des valeurs écrites de l'axe.</p>`,
      correction: `On mesure à la règle l'échelle et ${A.nMax} périodes, puis le tableau de proportionnalité donne ${A.nMax > 1 ? `${A.nMax}T ≈ ${PF.court(A.nMax * T)} ${unite}, donc ` : ''}<b>T ≈ ${PF.court(T)} ${unite}</b>.`,
      bilan: `T ≈ ${PF.court(T)} ${unite} et f = 1 / T ≈ ${PF.court(f)} Hz.`,
    });
  }

  /* ---------- C. Oscilloscope : carreaux × base de temps ---------- */
  function oscilloscope() {
    const base = hasard([0.1, 0.2, 0.5, 1, 5]);
    // le plus souvent, la période se compte au dixième de carreau ; parfois non (règle et tableau)
    const net = Math.random() < 0.8;
    const q1 = net ? hasard([2, 2.5, 3, 3.2, 4, 4.4, 5, 6]) : hasard([2.37, 3.63, 4.27, 2.83]);
    const T = +(q1 * base).toPrecision(4), forme = hasard(['sinus', 'clarinette', 'trompette']);
    const c0 = entre(2, 12) / 10;
    const sit = { signal: { forme, periode: T, ampl: entre(5, 9) / 2, phase: PF.phaseSommet(forme, T, c0 * base) }, baseTemps: base, sensibilite: 2 };
    const k = Math.max(1, Math.floor((10 - c0) / q1 + 1e-9));
    const q = { theme: 'Oscilloscope', consigne: 'Détermine la période T du signal sur l\'écran, puis sa fréquence f.',
      enonce: `<p>Base de temps : <b>${fmt(base)} ms/carreau</b> ; sensibilité verticale : <b>2 V/carreau</b>.</p>`, parties: [], sit, c0, net };
    const remplir = v => { const pf = PF.partiesFrequence({ T: +v.toPrecision(3), unite: 'ms', exact: T }); q.parties[1] = pf[0]; q.parties[2] = pf[1]; };
    q.parties.push({
      type: 'perso',
      q: 'Mesure la période T (méthode au choix).',
      monter(zone, api) {
        const fig = el('div'), ch = el('div');
        zone.appendChild(fig); zone.appendChild(ch);
        const oq = OSC.question({ figure: fig, champs: ch }, sit, {
          methode: 'directe',
          onErreur() { api.compter(); },
          onFini(t) { remplir(t); api.reussi(true); },
        });
        return { montrer() { oq.montrer(); remplir(T); ch.innerHTML = `<p class="pf-corr">${k > 1 ? `${k} périodes occupent ${fmt(+(k * q1).toFixed(2))} carreaux : ${k}T = ${fmt(+(k * q1).toFixed(2))} × ${fmt(base)} = ${PF.court(k * T)} ms, donc ` : `Une période occupe ${fmt(q1)} carreaux : `}<b>T = ${PF.court(T)} ms</b>.</p>`; } };
      },
    }, null, null);
    q.bilan = `T = ${PF.court(T)} ms et f = 1 / T ${PF.egal(1000 / T)} ${PF.court(1000 / T)} Hz.`;
    return q;
  }

  /* ---------- D. T ↔ f ---------- */
  function periodeFrequence() {
    if (Math.random() < 0.5) {
      // f à partir de T
      const c = hasard([{ T: 4, u: 'ms' }, { T: 5, u: 'ms' }, { T: 2.5, u: 'ms' }, { T: 8, u: 'ms' }, { T: 1.25, u: 'ms' }, { T: 20, u: 'ms' },
        { T: 500, u: 'µs' }, { T: 250, u: 'µs' }, { T: 800, u: 'µs' }, { T: 2.27, u: 'ms' }]);
      const f = 1 / (c.T * (c.u === 'ms' ? 1e-3 : 1e-6));
      return { theme: 'Période et fréquence', consigne: 'Calcule la fréquence du signal.',
        enonce: `<p>Un signal sonore a une période <b>T = ${fmt(c.T)} ${c.u}</b>.</p>`,
        parties: PF.partiesFrequence({ T: c.T, unite: c.u }), bilan: `f = 1 / T ${PF.egal(f)} ${PF.court(f)} Hz.` };
    }
    // T à partir de f
    const c = hasard([{ f: 250, u: 'Hz' }, { f: 440, u: 'Hz' }, { f: 500, u: 'Hz' }, { f: 50, u: 'Hz' }, { f: 1, u: 'kHz' }, { f: 2, u: 'kHz' }, { f: 1.25, u: 'kHz' }, { f: 0.8, u: 'kHz' }]);
    const fHz = c.f * (c.u === 'kHz' ? 1000 : 1), Ts = 1 / fHz;
    return { theme: 'Période et fréquence', consigne: 'Calcule la période du signal.',
      enonce: `<p>Un signal sonore a une fréquence <b>f = ${fmt(c.f)} ${c.u}</b>.</p>`,
      parties: [
        { type: 'nombre', sci: true, q: 'Calcule la période T en secondes.', label: 'T = 1 / f =', unite: 's',
          aide: 'Écris le nombre, puis l\'exposant de 10 (laisse 0 si tu écris un nombre décimal comme 0,002).',
          verifier(v) {
            if (PF.proche(v, Ts, 0.012)) return { ok: true };
            if (PF.proche(v, fHz, 0.02) || PF.proche(v, c.f, 0.02)) return { diag: 'T = 1 / f : la période est l\'inverse de la fréquence.' };
            if (c.u === 'kHz' && PF.proche(v, 1 / c.f, 0.02)) return { diag: 'Convertis d\'abord f en hertz : 1 kHz = 10<sup>3</sup> Hz.' };
            return { diag: `T = 1 / f, avec f en hertz : calcule 1 / ${fmt(fHz)}.` };
          },
          solution: `T = 1 / ${fmt(fHz)} ${Number.isInteger(1e6 / fHz) ? '=' : '≈'} ${PF.sciCourt(Ts)} s`,
          remplir(ins) { const e = Math.floor(Math.log10(Ts)); ins[0].value = fmt(+(Ts / Math.pow(10, e)).toPrecision(3)); ins[1].value = String(e).replace('-', '−'); } },
        { type: 'nombre', q: 'Convertis T en millisecondes.', label: 'T =', unite: 'ms',
          verifier(v) {
            if (PF.proche(v, Ts * 1e3, 0.012)) return { ok: true };
            if (PF.proche(v, Ts * 1e-3, 0.02)) return { diag: '1 s = 10<sup>3</sup> ms : T en ms est plus grand que T en secondes.' };
            if (PF.proche(v, Ts, 0.02)) return { diag: 'Tu as recopié la valeur en secondes : 1 s = 10<sup>3</sup> ms.' };
            return { diag: '1 s = 10<sup>3</sup> ms : multiplie T (en s) par 10<sup>3</sup>.' };
          },
          solution: `T = ${PF.sciCourt(Ts)} s ${PF.egal(Ts * 1e3)} ${PF.court(Ts * 1e3)} ms`,
          remplir(ins) { ins[0].value = PF.court(Ts * 1e3).replace(/\s/g, ''); } },
      ],
      bilan: `T = 1 / f ${PF.egal(Ts * 1e3)} ${PF.court(Ts * 1e3)} ms.` };
  }

  // 10 questions : 3 signaux à l'axe gradué, 2 à l'échelle, 3 oscilloscopes, 2 calculs T ↔ f
  function questionsSerie() {
    const ordre = [axeGradue, periodeFrequence, oscilloscope, papier, axeGradue, oscilloscope, periodeFrequence, axeGradue, oscilloscope, papier];
    return ordre.map(fab => fab());
  }

  PF.questionsSerie = questionsSerie;
  PF.fabriques = { axeGradue, papier, oscilloscope, periodeFrequence };
})();
