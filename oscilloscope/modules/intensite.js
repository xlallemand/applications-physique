/* ============================================================
   Module 4 : mesurer une intensité (simulateur)
   OS.intensite(zone, zoneSchema)   OS.schemaIntensite() → SVG du montage (aussi sur la fiche)

   Principe : un oscilloscope ne mesure que des tensions. On mesure la tension u_R aux bornes d'une
   résistance R placée en série : loi d'Ohm, i = u_R / R. L'intensité est proportionnelle à la
   tension affichée ; I_max = U_max / R.
   Déroulé guidé (signaux périodiques centrés sur 0 V, R et sensibilité qui changent) :
       1. Cursor, Mode : Manuel, Type : Y ;
       2. curseurs au maximum et au minimum de u_R : ΔY, puis U_max = ΔY / 2 ;
       3. I_max = U_max / R (en mA).
   « ↺ Nouveau signal » sous le déroulé.
   ============================================================ */
(function () {
  'use strict';

  const el = OS.el, fmt = OS.fmt, NB = ' ';
  const BASE = 0.5;                                        // ms/carreau
  const DEFIS = [
    { forme: 'sinus', T: 2, A: 2.35, s: 1, R: 100 },
    { forme: 'triangle', T: 2.5, A: 4.7, s: 2, R: 220 },
    { forme: 'carre', T: 2, A: 1.6, s: 0.5, R: 47 },
    { forme: 'sinus', T: 4, A: 6.8, s: 2, R: 1000 },
    { forme: 'dent', T: 2, A: 0.74, s: 0.2, R: 10 },
    { forme: 'sinus', T: 1, A: 3.3, s: 1, R: 470 },
  ];
  const proche = (a, b, r) => Math.abs(a - b) <= (r || 0.02) * Math.abs(b);
  const ohm = R => `${fmt(R)}${NB}Ω`;

  /* ---------- Schéma du montage : GBF, dipôle D et résistance R en série ; CH1 aux bornes de R ---------- */
  function schemaIntensite() {
    const T = 'font-family="var(--font-sans)" font-weight="800"';
    return `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schéma${NB}: générateur, dipôle D et résistance R en série${NB}; la voie CH1 de l'oscilloscope mesure la tension u_R aux bornes de R, la masse est à l'autre borne de R.">
      <g fill="none" stroke="var(--ink)" stroke-width="1.6">
        <path d="M30,61 V25 H82 M118,25 H170 V55 M170,95 V125 H30 V89"/>
        <circle cx="30" cy="75" r="14"/>
        <rect x="82" y="17" width="36" height="16" rx="1" fill="var(--sheet)"/>
        <rect x="163" y="55" width="14" height="40" rx="1" fill="var(--sheet)"/>
        <path d="M170,40 H206" />
        <path d="M170,125 H196 V131 M188,131 H204 M191,135 H201 M194,139 H198"/>
      </g>
      <path d="M22,76 q4,-7 8,0 t8,0" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="8" y="79" ${T} font-size="8" text-anchor="middle" fill="var(--ink-2)">G</text>
      <text x="100" y="28.5" ${T} font-size="10" text-anchor="middle" fill="var(--ink)">D</text>
      <text x="155" y="79" ${T} font-size="10" text-anchor="end" fill="var(--ink)">R</text>
      <circle cx="170" cy="40" r="2.2" fill="var(--ink)"/><circle cx="170" cy="125" r="2.2" fill="var(--ink)"/>
      <rect x="206" y="33" width="26" height="14" rx="3" fill="var(--osc-ch1)"/>
      <text x="219" y="43.5" ${T} font-size="9" text-anchor="middle" fill="var(--ink)">CH1</text>
      <text x="212" y="139" ${T} font-size="8" fill="var(--ink-2)">masse</text>
      <!-- tension u_R aux bornes de R (flèche) -->
      <path d="M190,92 V60" stroke="var(--accent-ink)" stroke-width="1.4"/>
      <path d="M190,55 l-3.2,6.5 h6.4z" fill="var(--accent-ink)"/>
      <text x="195" y="80" ${T} font-size="10" fill="var(--accent-ink)">u<tspan font-size="7" dy="2.5">R</tspan></text>
      <!-- sens du courant i -->
      <path d="M150,21 l7,4 l-7,4z" fill="var(--accent-ink)"/>
      <text x="153" y="16" ${T} font-size="10" text-anchor="middle" fill="var(--accent-ink)">i</text>
    </svg>`;
  }

  function intensite(zone, zoneSchema) {
    if (zoneSchema) zoneSchema.innerHTML = schemaIntensite();
    let dernier = -1;
    function afficher() {
      zone.innerHTML = '';
      const carte = el('div', 'er-card');
      zone.appendChild(carte);
      defi(carte);
      carte.querySelector('[data-a="nouveau"]').onclick = () => afficher();
    }
    function tirer() {
      let i;
      do { i = Math.floor(Math.random() * DEFIS.length); } while (i === dernier && DEFIS.length > 1);
      dernier = i;
      OS.defiEnCours = DEFIS[i];             // défi en cours (utile pour vérifier l'application)
      return DEFIS[i];
    }

    function defi(corps) {
      const D = tirer(), Imax = D.A / D.R * 1000;          // mA
      const etapes = [
        `Appuie sur <b>Cursor</b>, règle <b>Mode${NB}: Manuel</b> (1<sup>er</sup> bouton), puis appuie sur <b>Type</b> (2<sup>e</sup> bouton) pour passer en <b>Y</b>${NB}: curseurs verticaux, pour mesurer une tension.`,
        `Place les curseurs A et B au <b>maximum</b> et au <b>minimum</b> de u<sub>R</sub>. Lis <b>ΔY</b>, puis calcule <b>U<sub>max</sub> = ΔY / 2</b>.`,
        `Calcule l'intensité maximale <b>I<sub>max</sub> = U<sub>max</sub> / R</b>, avec R = ${ohm(D.R)}.`,
      ];
      corps.innerHTML = `<div class="os-manip os-manip-osc">
          <div class="os-manip-fig"><p class="os-fig-t">La voie 1 affiche la tension u<sub>R</sub> aux bornes de la résistance <b>R = ${ohm(D.R)}</b>. Mesure l'intensité maximale I<sub>max</sub> du courant.</p>
            <p class="osc-aide">Appuie sur <b>Cursor</b>, règle le menu avec les boutons à droite de l'écran, choisis <b>CurA</b> et/ou <b>CurB</b>, puis tourne le <b>bouton de réglage</b> (ou appuie sur sa moitié gauche ou droite).</p><div data-a="ecran"></div></div>
          <div class="os-manip-panneau">
            <ol class="os-deroule">${etapes.map((t, k) => `<li><span>${t}</span><div class="os-li-zone" data-z="${k}"></div></li>`).join('')}</ol>
            <div class="os-nouveau"><button type="button" class="btn-small" data-a="nouveau">↺ Nouveau signal</button></div>
            <div data-a="fin"></div>
          </div>
        </div>`;
      const $ = a => corps.querySelector(`[data-a="${a}"]`), Z = k => corps.querySelector(`[data-z="${k}"]`);
      const lis = corps.querySelectorAll('.os-deroule li');
      let etape = 0, Umes = null;
      OS.deroule(lis, 0);
      const ecran = OSC.monter($('ecran'), {
        voies: [{ signal: { forme: D.forme, periode: D.T, ampl: D.A, phase: 0.2 }, sens: D.s, pos: 0 }],
        baseTemps: BASE, curseurs: true,
        onChange(st) { if (etape === 0 && st.menu && st.mode === 'Manuel' && st.type === 'Y') passer(1); },
      });
      const lu = v => { const L = ecran.lecture(); return L.dec ? fmt(v, L.dec) : fmt(v); };
      const pres = (c, l) => Math.abs(c - l) <= 0.1;

      const parties = [null, [
        {
          type: 'nombre', label: 'ΔY =', unite: 'V',
          verifier(v) {
            const m = ecran.mesure(), E = ecran.extremes(0);
            if (!m.actifs || m.type !== 'Y') return { format: `Affiche d'abord les curseurs de tension${NB}: appuie sur <b>Cursor</b>, règle <b>Mode${NB}: Manuel</b> et <b>Type${NB}: Y</b>.` };
            if (!((pres(m.a, E.max) && pres(m.b, E.min)) || (pres(m.a, E.min) && pres(m.b, E.max)))) {
              if ([m.a, m.b].some(c => pres(c, OSC.NY / 2))) return { diag: `Un curseur est sur le 0${NB}V. Place l'un au <b>maximum</b>, l'autre au <b>minimum</b> de u<sub>R</sub>.` };
              return { diag: 'Place un curseur sur le point le plus haut (maximum) et l\'autre sur le point le plus bas (minimum) de la courbe.' };
            }
            const L = ecran.lecture();
            if (proche(v, L.delta, 0.01) || proche(v, 2 * D.A, 0.025)) return { ok: true };
            if (proche(v, Math.abs(L.va), 0.01) || proche(v, Math.abs(L.vb), 0.01)) return { diag: 'Tu as lu la valeur d\'un curseur. ΔY est l\'écart entre les deux curseurs.' };
            return { diag: 'Lis ΔY sous l\'écran.' };
          },
          solution: () => `ΔY = <b>${lu(ecran.lecture().delta)}${NB}V</b>`,
          remplir(ins) { const E = ecran.extremes(0); ecran.ouvrirCurseurs('Y', 0); ecran.poser(E.max, E.min); ins[0].value = lu(ecran.lecture().delta).replace(/\s/g, ''); },
        },
        {
          type: 'nombre', label: 'U<sub>max</sub> = ΔY / 2 =', unite: 'V',
          verifier(v) {
            const dY = ecran.lecture().delta;
            if (proche(v, dY / 2, 0.01) || proche(v, D.A, 0.025)) { Umes = v; return { ok: true }; }
            if (proche(v, dY, 0.01)) return { diag: `ΔY va du minimum au maximum${NB}: c'est deux fois U<sub>max</sub>. Divise ΔY par 2.` };
            if (proche(v, 2 * dY, 0.01)) return { diag: 'Divise ΔY par 2, ne le multiplie pas.' };
            return { diag: 'U<sub>max</sub> = ΔY / 2.' };
          },
          solution: () => `U<sub>max</sub> = ${lu(ecran.lecture().delta)} / 2 ${OS.egal(ecran.lecture().delta / 2)} <b>${OS.court(ecran.lecture().delta / 2)}${NB}V</b>`,
          remplir(ins) { Umes = +(ecran.lecture().delta / 2).toPrecision(3); ins[0].value = fmt(Umes); },
        },
      ], [
        {
          type: 'nombre', label: 'I<sub>max</sub> = U<sub>max</sub> / R =', unite: 'mA', calc: true,
          aide: '1\u00a0A = 1\u00a0000\u00a0mA',
          verifier(v) {
            const U = Umes || D.A, I = U / D.R * 1000;
            if (proche(v, I, 0.02) || proche(v, Imax, 0.02)) return { ok: true };
            if (proche(v, I / 1000, 0.02)) return { diag: `Tu as donné I<sub>max</sub> en ampères. Convertis en milliampères${NB}: 1${NB}A = 1${NB}000${NB}mA.` };
            if (proche(v, U * D.R, 0.02) || proche(v, U * D.R * 1000, 0.02) || proche(v, U * D.R / 1000, 0.02)) return { diag: `i = u<sub>R</sub> / R${NB}: on divise la tension par R, on ne multiplie pas.` };
            if (proche(v, 2 * I, 0.02) || proche(v, 2 * I / 1000, 0.02)) return { diag: `Tu as divisé ΔY par R. Divise U<sub>max</sub> (= ΔY / 2) par R.` };
            if (proche(v, D.R / U, 0.02) || proche(v, D.R / U * 1000, 0.02)) return { diag: `I<sub>max</sub> = U<sub>max</sub> / R${NB}: c'est la tension divisée par la résistance.` };
            return { diag: `I<sub>max</sub> = U<sub>max</sub> / R, avec U<sub>max</sub> en V et R en Ω, donne I<sub>max</sub> en A${NB}; puis 1${NB}A = 1${NB}000${NB}mA.` };
          },
          solution: () => { const U = Umes || D.A, I = U / D.R; return `I<sub>max</sub> = ${fmt(U)} / ${fmt(D.R)} ${OS.egal(I)} ${OS.court(I)}${NB}A = <b>${OS.court(I * 1000)}${NB}mA</b>`; },
          remplir(ins) { ins[0].value = OS.court((Umes || D.A) / D.R * 1000).replace(/\s/g, ''); },
        },
      ]];
      function passer(i) {
        etape = i;
        OS.deroule(lis, i);
        if (i === parties.length) return terminer();
        OS.question(Z(i), { parties: parties[i] }, { fin: () => passer(i + 1) }, 'manip');
        OS.amener(Z(i));
      }
      function terminer() {
        ecran.verrouiller();
        OS.finDefi($('fin'), `L'oscilloscope mesure la tension u<sub>R</sub> aux bornes de R${NB}; l'intensité lui est proportionnelle${NB}: <b>i = u<sub>R</sub> / R</b>. Avec les curseurs au minimum et au maximum, U<sub>max</sub> = ΔY / 2, puis <b>I<sub>max</sub> = U<sub>max</sub> / R</b>.`,
          { fiche: 'fiche_4.html' }, () => afficher());
      }
    }
    afficher();
  }

  OS.intensite = intensite;
  OS.schemaIntensite = schemaIntensite;
})();
