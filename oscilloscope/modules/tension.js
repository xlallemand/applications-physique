/* ============================================================
   Module 3 : mesurer une tension (deux simulateurs)
   OS.tension(zone, 'carreaux' | 'curseurs')

   Deux signaux centrés sur 0 V, de formes différentes, sur les voies 1 (jaune) et 2 (bleu),
   chacune avec sa propre sensibilité verticale (CH1, CH2 sous l'écran). But : U_max.
   Questions à côté de l'oscilloscope (déroulé guidé), pour ne pas avoir à faire défiler la page.

   'carreaux' (module_3a_carreaux.html) — sans curseur ; un appui sur l'écran trace un trait
     horizontal en pointillés :
       1. voie 1 : carreaux entre le 0 V et le maximum ; 2. U_max = nombre de carreaux × sensibilité de CH1 ;
       3. voie 2 : carreaux ; 4. U_max = nombre de carreaux × sensibilité de CH2.
   'curseurs' (module_3b_curseurs.html) :
       1. Cursor, Mode : Manuel, Type : Y (bouton Type), Source : CH1 ;
       2. un curseur sur le maximum du signal jaune : centré sur 0 V, la valeur du curseur est U_max ;
       3. curseurs au maximum et au minimum : ΔY, puis U_max = ΔY / 2 ;
       4. Source : CH2 (échelle de la voie 2) : U_max du signal bleu = ΔY / 2 ;
       5. signal jaune NON centré (tension continue ajoutée) : la valeur du curseur au maximum n'est
          plus U_max ; seule U_max = ΔY / 2 convient.
   « ↺ Nouveau signal » sous le déroulé.
   ============================================================ */
(function () {
  'use strict';

  const el = OS.el, fmt = OS.fmt, NB = ' ';
  const BASE = 0.5;                                        // ms/carreau (la base de temps ne sert pas ici)
  // défis « carreaux » : U_max = n carreaux exactement (au cinquième de carreau)
  const DEFIS_CAR = [
    { f1: 'sinus', n1: 3, s1: 2, f2: 'triangle', n2: 2.4, s2: 0.5, T1: 2, T2: 1 },
    { f1: 'triangle', n1: 2.6, s1: 1, f2: 'sinus', n2: 3.2, s2: 0.2, T1: 2.5, T2: 1.25 },
    { f1: 'carre', n1: 2, s1: 5, f2: 'sinus', n2: 3.6, s2: 0.5, T1: 2, T2: 4 },
    { f1: 'sinus', n1: 2.2, s1: 5, f2: 'dent', n2: 3, s2: 0.1, T1: 4, T2: 2 },
    { f1: 'dent', n1: 3.4, s1: 2, f2: 'carre', n2: 1.6, s2: 1, T1: 2.5, T2: 2.5 },
    { f1: 'triangle', n1: 3.8, s1: 0.5, f2: 'sinus', n2: 2.8, s2: 2, T1: 2, T2: 1 },
  ].map(d => Object.assign(d, { A1: +(d.n1 * d.s1).toFixed(4), A2: +(d.n2 * d.s2).toFixed(4) }));
  // défis « curseurs » : U_max quelconques ; dec : tension continue ajoutée à la voie 1 (étape 5)
  const DEFIS_CUR = [
    { f1: 'sinus', A1: 4.6, s1: 2, f2: 'triangle', A2: 1.35, s2: 0.5, T1: 2, T2: 1, dec: 2.4 },
    { f1: 'triangle', A1: 2.3, s1: 1, f2: 'sinus', A2: 0.62, s2: 0.2, T1: 2.5, T2: 1.25, dec: 1.2 },
    { f1: 'carre', A1: 7.5, s1: 5, f2: 'sinus', A2: 1.7, s2: 0.5, T1: 2, T2: 4, dec: -5 },
    { f1: 'sinus', A1: 2.7, s1: 1, f2: 'carre', A2: 3.4, s2: 2, T1: 4, T2: 2, dec: -1.1 },
    { f1: 'dent', A1: 4.2, s1: 2, f2: 'triangle', A2: 0.36, s2: 0.1, T1: 2.5, T2: 2.5, dec: 2.6 },
    { f1: 'sinus', A1: 1.15, s1: 0.5, f2: 'dent', A2: 5.8, s2: 2, T1: 2, T2: 1, dec: 0.6 },
  ];
  const voies = (D, dec) => [
    { signal: { forme: D.f1, periode: D.T1, ampl: D.A1, phase: 0.3, decal: dec || 0 }, sens: D.s1, pos: 0 },
    { signal: { forme: D.f2, periode: D.T2, ampl: D.A2, phase: 0.1 }, sens: D.s2, pos: 0 },
  ];
  const proche = (a, b, r) => Math.abs(a - b) <= (r || 0.02) * Math.abs(b);
  const VOIE = k => `<span class="os-voie os-voie-${k + 1}">voie ${k + 1}</span>`;
  const NOM = ['jaune', 'bleu'];
  // tension écrite en V (2 ou 3 chiffres significatifs)
  const V = v => `${OS.court(v)}${NB}V`;

  function tension(zone, type) {
    let dernier = -1;
    function afficher() {
      zone.innerHTML = '';
      const carte = el('div', 'er-card');
      zone.appendChild(carte);
      (type === 'curseurs' ? defiCurseurs : defiCarreaux)(carte);
      carte.querySelector('[data-a="nouveau"]').onclick = () => afficher();
    }
    function tirer(liste) {
      let i;
      do { i = Math.floor(Math.random() * liste.length); } while (i === dernier && liste.length > 1);
      dernier = i;
      OS.defiEnCours = liste[i];             // défi en cours (utile pour vérifier l'application)
      return liste[i];
    }
    function squelette(corps, intro, aide, etapes) {
      corps.innerHTML = `<div class="os-manip os-manip-osc">
          <div class="os-manip-fig"><p class="os-fig-t">${intro}</p>${aide ? `<p class="osc-aide">${aide}</p>` : ''}<div data-a="ecran"></div></div>
          <div class="os-manip-panneau">
            <ol class="os-deroule">${etapes.map((t, k) => `<li><span>${t}</span><div class="os-li-zone" data-z="${k}"></div></li>`).join('')}</ol>
            <div class="os-nouveau"><button type="button" class="btn-small" data-a="nouveau">↺ Nouveau signal</button></div>
            <div data-a="fin"></div>
          </div>
        </div>`;
      return { $: a => corps.querySelector(`[data-a="${a}"]`), Z: k => corps.querySelector(`[data-z="${k}"]`), lis: corps.querySelectorAll('.os-deroule li') };
    }

    /* ============================================================
       EN COMPTANT LES CARREAUX
       ============================================================ */
    function defiCarreaux(corps) {
      const D = tirer(DEFIS_CAR);
      const { $, Z, lis } = squelette(corps,
        `Deux signaux centrés sur 0${NB}V${NB}: un sur la ${VOIE(0)}, un sur la ${VOIE(1)}, chacun avec sa sensibilité verticale. Mesure la tension maximale U<sub>max</sub> de chacun en comptant les carreaux.`,
        `Touche l'écran (ou fais glisser ton doigt ou la souris)${NB}: un trait horizontal en pointillés t'aide à repérer les niveaux.`,
        [`Signal jaune (voie 1)${NB}: compte les carreaux entre le <b>0${NB}V</b> (repère 1 ▸, ici l'axe central) et le <b>maximum</b> du signal.`,
         'Calcule <b>U<sub>max</sub> = nombre de carreaux × sensibilité verticale de CH1</b>.',
         `Signal bleu (voie 2)${NB}: compte les carreaux entre le 0${NB}V (repère 2 ▸) et le <b>maximum</b> du signal.`,
         'Calcule <b>U<sub>max</sub> = nombre de carreaux × sensibilité verticale de CH2</b>.']);
      const ecran = OSC.monter($('ecran'), { voies: voies(D), baseTemps: BASE, trait: 'h' });
      const n = [D.n1, D.n2], s = [D.s1, D.s2], A = [D.A1, D.A2];

      // nombre de carreaux entre le 0 V et le maximum du signal de la voie k
      const compter = k => ({
        type: 'nombre', label: `Nombre de carreaux${NB}:`, unite: 'carreaux', aria: 'Nombre de carreaux',
        verifier(v) {
          if (Math.abs(v - n[k]) <= 0.12) return { ok: true };
          if (OSC.dixiemes(v, n[k])) return { diag: OSC.MSG_TRAIT };
          const zero = OSC.NY / 2 - (ecran.o.voies[k].pos || 0);       // ligne du 0 V de la voie k
          if (Math.abs(v - 2 * n[k]) <= 0.15) return { diag: `Tu as compté du minimum au maximum${NB}: c'est deux fois U<sub>max</sub>. Compte depuis le 0${NB}V (repère ${k + 1} ▸) jusqu'au maximum.` };
          if (Math.abs(v - n[1 - k]) <= 0.12) return { diag: `C'est le signal ${NOM[1 - k]} (voie ${2 - k}). Compte sur le signal ${NOM[k]} (voie ${k + 1}).` };
          if (Math.abs(v - (zero - n[k])) <= 0.12) return { diag: `Tu as compté depuis le haut de l'écran. Compte depuis le 0${NB}V (repère ${k + 1} ▸) jusqu'au maximum du signal.` };
          return { diag: `Compte les carreaux entre le 0${NB}V (repère ${k + 1} ▸) et le point le plus haut du signal ${NOM[k]}, au cinquième de carreau près${NB}: sur l'axe vertical central, un petit trait vaut 0,2 carreau.` };
        },
        solution: `Du 0${NB}V au maximum du signal ${NOM[k]}${NB}: ${fmt(n[k])} carreaux.`,
        remplir(ins) {
          const zero = OSC.NY / 2 - (ecran.o.voies[k].pos || 0);
          ins[0].value = fmt(n[k]); ecran.fleche(k ? 7.2 : 2.6, zero, zero - n[k], 'U<tspan baseline-shift="sub" font-size="2.8">max</tspan>');
        },
      });
      // U_max = nombre de carreaux × sensibilité de la voie k
      const calculer = k => ({
        type: 'nombre', label: `U<sub>max</sub> =`, unite: 'V',
        verifier(v) {
          const U = A[k];
          if (proche(v, U, 0.01)) return { ok: true };
          if (proche(v, n[k] * s[1 - k], 0.01)) return { diag: `Tu as utilisé la sensibilité de CH${2 - k}. Le signal ${NOM[k]} est sur la voie ${k + 1}${NB}: lis la sensibilité après CH${k + 1}.` };
          if (s[k] !== 1 && proche(v, n[k], 0.01)) return { diag: `Tu as donné des carreaux. Multiplie par la sensibilité verticale de CH${k + 1} (tension d'un carreau).` };
          if (proche(v, n[k] / s[k], 0.01)) return { diag: 'On multiplie le nombre de carreaux par la sensibilité, on ne divise pas.' };
          if (proche(v, 2 * U, 0.01)) return { diag: `C'est la tension du minimum au maximum. U<sub>max</sub> se mesure depuis le 0${NB}V.` };
          if (s[k] < 1 && proche(v, U * 1000, 0.01)) return { diag: `La sensibilité de CH${k + 1} est en mV${NB}: 1${NB}mV = 0,001${NB}V. Donne U<sub>max</sub> en volts.` };
          if (proche(v, n[k] * BASE, 0.01)) return { diag: 'La base de temps (Time) sert aux durées. Pour une tension, on utilise la sensibilité verticale de la voie.' };
          return { diag: `U<sub>max</sub> = nombre de carreaux × sensibilité verticale de CH${k + 1}, lue sous l'écran.` };
        },
        solution: `U<sub>max</sub> = ${fmt(n[k])} × ${OSC.sensTexte(s[k])} = <b>${V(A[k])}</b>`,
        remplir(ins) { ins[0].value = OS.court(A[k]).replace(/\s/g, ''); },
      });
      const etapes = [compter(0), calculer(0), compter(1), calculer(1)];
      function etape(i) {
        OS.deroule(lis, i);
        if (i === etapes.length) return terminer();
        OS.question(Z(i), { parties: [etapes[i]] }, { fin: () => etape(i + 1) }, 'manip');
        if (i) OS.amener(Z(i));
      }
      function terminer() {
        ecran.verrouiller();
        OS.finDefi($('fin'), `<b>U<sub>max</sub> = nombre de carreaux × sensibilité verticale</b>, en comptant depuis le 0${NB}V. Chaque voie a sa propre sensibilité${NB}: on lit celle de la voie du signal mesuré (CH1 pour le jaune, CH2 pour le bleu).`,
          { fiche: 'fiche_3.html#carreaux', suite: { href: 'module_3b_curseurs.html', label: 'Utiliser les curseurs →' } }, () => afficher());
      }
      etape(0);
    }

    /* ============================================================
       EN UTILISANT LES CURSEURS
       ============================================================ */
    function defiCurseurs(corps) {
      const D = tirer(DEFIS_CUR);
      const { $, Z, lis } = squelette(corps,
        `Deux signaux centrés sur 0${NB}V${NB}: un sur la ${VOIE(0)}, un sur la ${VOIE(1)}, chacun avec sa sensibilité verticale. Mesure leur tension maximale U<sub>max</sub> avec les curseurs.`,
        `Appuie sur <b>Cursor</b>, règle le menu avec les boutons à droite de l'écran, choisis <b>CurA</b> et/ou <b>CurB</b>, puis tourne le <b>bouton de réglage</b> (ou appuie sur sa moitié gauche ou droite).`,
        [`Appuie sur <b>Cursor</b>, règle <b>Mode${NB}: Manuel</b> (1<sup>er</sup> bouton), puis appuie sur <b>Type</b> (2<sup>e</sup> bouton) pour passer en <b>Y</b>${NB}: curseurs verticaux, pour mesurer une tension. Vérifie <b>Source${NB}: CH1</b> (3<sup>e</sup> bouton).`,
         `Choisis <b>CurA</b> (4<sup>e</sup> bouton) et place le curseur A sur le <b>maximum</b> du signal jaune. Le signal est <b>centré sur 0${NB}V</b>${NB}: la valeur du curseur au maximum, lue sous l'écran, est directement U<sub>max</sub>.`,
         `Choisis <b>CurB</b> (5<sup>e</sup> bouton) et place le curseur B sur le <b>minimum</b> du signal jaune. Lis <b>ΔY</b>, puis calcule <b>U<sub>max</sub> = ΔY / 2</b>.`,
         `Appuie sur <b>Source</b> (3<sup>e</sup> bouton) pour passer sur <b>CH2</b>${NB}: les curseurs prennent l'échelle de la voie 2. Place-les au maximum et au minimum du signal bleu, puis calcule <b>U<sub>max</sub> = ΔY / 2</b>.`,
         `Le signal jaune n'est plus centré sur 0${NB}V. Reviens sur <b>Source${NB}: CH1</b> et place un curseur sur le <b>maximum</b> du signal jaune.`]);
      let etape = 0, decale = false;
      OS.deroule(lis, 0);
      const ecran = OSC.monter($('ecran'), {
        voies: voies(D), baseTemps: BASE, curseurs: true,
        onChange(st) { if (etape === 0 && st.menu && st.mode === 'Manuel' && st.type === 'Y' && st.source === 0) passer(1); },
      });
      const A = [D.A1, D.A2];

      /* ---------- vérifications sur l'état de l'oscilloscope ---------- */
      // curseurs de type Y affichés et Source sur la voie k ? (message, ou null)
      function reglage(k) {
        const m = ecran.mesure();
        if (!m.actifs || m.type !== 'Y') return { format: `Affiche d'abord les curseurs de tension${NB}: appuie sur <b>Cursor</b>, règle <b>Mode${NB}: Manuel</b> et <b>Type${NB}: Y</b>.` };
        if (m.source !== k) return { diag: `Source est sur CH${m.source + 1}${NB}: les valeurs des curseurs sont calculées avec l'échelle de la voie ${m.source + 1}. Appuie sur <b>Source</b> pour passer sur CH${k + 1}.` };
        return null;
      }
      const pres = (c, l) => Math.abs(c - l) <= 0.1;
      // curseur sur le maximum de la voie k : 'a', 'b' ou null
      function auMax(k) {
        const m = ecran.mesure(), E = ecran.extremes(k);
        return pres(m.a, E.max) ? 'a' : pres(m.b, E.max) ? 'b' : null;
      }
      // les deux curseurs au maximum et au minimum de la voie k ? (diagnostic, ou null)
      function minMax(k) {
        const m = ecran.mesure(), E = ecran.extremes(k), E2 = ecran.extremes(1 - k);
        if ((pres(m.a, E.max) && pres(m.b, E.min)) || (pres(m.a, E.min) && pres(m.b, E.max))) return null;
        if ([m.a, m.b].some(c => pres(c, E2.max) || pres(c, E2.min)) && ![m.a, m.b].some(c => pres(c, E.max) || pres(c, E.min)))
          return `Les curseurs sont sur le signal ${NOM[1 - k]}. Place-les sur le signal ${NOM[k]} (voie ${k + 1}).`;
        if (pres(m.a, E.max) && pres(m.b, E.max)) return `Les deux curseurs sont au maximum. Place l'un au <b>maximum</b>, l'autre au <b>minimum</b> du signal ${NOM[k]}.`;
        const zero = OSC.NY / 2 - (ecran.o.voies[k].pos || 0);
        if ([m.a, m.b].some(c => pres(c, zero))) return `Un curseur est sur le 0${NB}V. Place l'un au <b>maximum</b>, l'autre au <b>minimum</b> du signal ${NOM[k]}${NB}: U<sub>max</sub> = ΔY / 2.`;
        return `Place un curseur sur le point le plus haut (maximum) et l'autre sur le point le plus bas (minimum) du signal ${NOM[k]}.`;
      }
      const montrerMinMax = k => { const E = ecran.extremes(k); ecran.ouvrirCurseurs('Y', k); ecran.poser(E.max, E.min); };
      const lu = v => (ecran.lecture().dec ? fmt(v, ecran.lecture().dec) : fmt(v));

      /* ---------- parties ---------- */
      // valeur du curseur placé au maximum (signal centré : c'est U_max ; étape 5 : ce n'est plus U_max)
      const valeurMax = (label, centre) => ({
        type: 'nombre', label, unite: 'V',
        verifier(v) {
          const r = reglage(0); if (r) return r;
          const c = auMax(0);
          if (!c) {
            const m = ecran.mesure(), E = ecran.extremes(0), E2 = ecran.extremes(1);
            if (pres(m.a, E.min) || pres(m.b, E.min)) return { diag: `Ce curseur est sur le minimum. Place-le sur le <b>maximum</b>${NB}: le point le plus haut du signal jaune.` };
            if (pres(m.a, E2.max) || pres(m.b, E2.max)) return { diag: 'C\'est le maximum du signal bleu. Place le curseur sur le maximum du signal jaune (voie 1).' };
            return { diag: 'Place un curseur sur le point le plus haut du signal jaune.' };
          }
          const L = ecran.lecture(), vc = c === 'a' ? L.va : L.vb;
          if (proche(v, vc, 0.01) || (centre && proche(v, A[0], 0.025))) return { ok: true };
          if (proche(v, L.delta, 0.01)) return { diag: 'Tu as lu ΔY. Ici, lis la valeur du curseur placé au maximum (CurA ou CurB).' };
          if (proche(v, c === 'a' ? L.vb : L.va, 0.01)) return { diag: 'Lis la valeur du curseur placé au maximum.' };
          return { diag: 'Lis, sous l\'écran, la valeur du curseur placé au maximum.' };
        },
        solution: () => { const L = ecran.lecture(), c = auMax(0); return `Valeur du curseur au maximum${NB}: <b>${lu(c === 'b' ? L.vb : L.va)}${NB}V</b>.`; },
        remplir(ins) {
          const E = ecran.extremes(0), m = ecran.mesure();
          ecran.ouvrirCurseurs('Y', 0); ecran.poser(E.max, m.b === E.max ? E.min : m.b);
          ins[0].value = lu(ecran.lecture().va).replace(/\s/g, '');
        },
      });
      // ΔY avec les curseurs au maximum et au minimum de la voie k
      const deltaY = k => ({
        type: 'nombre', label: 'ΔY =', unite: 'V',
        verifier(v) {
          const r = reglage(k); if (r) return r;
          const d = minMax(k); if (d) return { diag: d };
          const L = ecran.lecture();
          if (proche(v, L.delta, 0.01) || proche(v, 2 * A[k], 0.025)) return { ok: true };
          if (proche(v, Math.abs(L.va), 0.01) || proche(v, Math.abs(L.vb), 0.01)) return { diag: 'Tu as lu la valeur d\'un curseur. ΔY est l\'écart entre les deux curseurs, affiché après CurB.' };
          if (proche(v, L.delta / 2, 0.01)) return { diag: 'Écris d\'abord ΔY tel qu\'il est affiché. La division par 2 vient ensuite.' };
          return { diag: 'Lis ΔY sous l\'écran.' };
        },
        solution: () => `ΔY = <b>${lu(ecran.lecture().delta)}${NB}V</b>`,
        remplir(ins) { montrerMinMax(k); ins[0].value = lu(ecran.lecture().delta).replace(/\s/g, ''); },
      });
      // U_max = ΔY / 2 (voie k)
      const moitie = k => ({
        type: 'nombre', label: 'U<sub>max</sub> = ΔY / 2 =', unite: 'V',
        verifier(v) {
          const dY = ecran.lecture().delta;
          if (proche(v, dY / 2, 0.01) || proche(v, A[k], 0.025)) return { ok: true };
          if (proche(v, dY, 0.01)) return { diag: `ΔY va du minimum au maximum${NB}: c'est deux fois U<sub>max</sub>. Divise ΔY par 2.` };
          if (proche(v, 2 * dY, 0.01)) return { diag: 'Divise ΔY par 2, ne le multiplie pas.' };
          return { diag: 'U<sub>max</sub> = ΔY / 2.' };
        },
        solution: () => `U<sub>max</sub> = ${lu(ecran.lecture().delta)} / 2 ${OS.egal(ecran.lecture().delta / 2)} <b>${V(ecran.lecture().delta / 2)}</b>`,
        remplir(ins) { ins[0].value = OS.court(ecran.lecture().delta / 2).replace(/\s/g, ''); },
      });
      const piege = {
        type: 'choix', colonne: true,
        q: 'Cette valeur est-elle la tension maximale U<sub>max</sub> du signal jaune ?',
        options: [
          { id: 'non', label: `Non${NB}: le signal n'est pas centré sur 0${NB}V. Le curseur donne la tension depuis le 0${NB}V, pas U<sub>max</sub>.` },
          { id: 'oui', label: `Oui${NB}: la valeur du curseur au maximum est toujours U<sub>max</sub>.` },
          { id: 'source', label: `Oui, car la Source est sur CH1.` },
        ],
        bonne: 'non',
        indices: {
          oui: `Regarde le repère 1 ▸${NB}: le 0${NB}V n'est plus au milieu du signal. La valeur du curseur au maximum ajoute la tension continue à U<sub>max</sub>.`,
          source: `La Source donne la bonne échelle, mais le 0${NB}V n'est plus au milieu du signal${NB}: la valeur du curseur au maximum n'est pas U<sub>max</sub>.`,
        },
        solution: `Non${NB}: le signal est décalé. U<sub>max</sub> se mesure avec les deux curseurs, au minimum et au maximum${NB}: U<sub>max</sub> = ΔY / 2.`,
      };

      /* ---------- enchaînement des étapes ---------- */
      const PARTIES = [
        null,
        [valeurMax(`U<sub>max</sub> = valeur du curseur =`, true)],
        [deltaY(0), moitie(0)],
        [deltaY(1), moitie(1)],
        [valeurMax(`Valeur du curseur au maximum${NB}:`, false), piege, deltaY(0), moitie(0)],
      ];
      function passer(i) {
        etape = i;
        OS.deroule(lis, i);
        if (i === PARTIES.length) return terminer();
        if (i === 4 && !decale) {
          // le générateur ajoute une tension continue au signal de la voie 1
          decale = true;
          ecran.maj({ voies: voies(D, D.dec) });
          Z(4).insertAdjacentHTML('beforeend', `<div class="callout os-info"><p>Le générateur ajoute maintenant une tension continue au signal de la voie 1${NB}: il est décalé vers le ${D.dec > 0 ? 'haut' : 'bas'}.</p></div>`);
        }
        OS.question(Z(i), { parties: PARTIES[i] }, { fin: () => passer(i + 1) }, 'manip');
        OS.amener(Z(i));
      }
      function terminer() {
        ecran.verrouiller();
        OS.finDefi($('fin'), `Avec les curseurs de type Y, <b>Source</b> choisit l'échelle (CH1 ou CH2). Lire un seul curseur au maximum donne U<sub>max</sub> seulement si le signal est centré sur 0${NB}V. Avec les curseurs au minimum et au maximum, <b>U<sub>max</sub> = ΔY / 2</b> convient toujours, centré ou non.`,
          { fiche: 'fiche_3.html#curseurs', suite: { href: 'module_4_intensite.html', label: `Module 4${NB}: mesurer une intensité →` } }, () => afficher());
      }
    }
    afficher();
  }

  OS.tension = tension;
})();
