/* ============================================================
   Module 1 : mesurer une durée entre deux signaux (deux simulateurs)
   OS.duree(zone, 'carreaux' | 'curseurs')

   Un même signal (salve ultrasonore : quelques oscillations qui grandissent puis s'amortissent,
   répétée régulièrement) arrive sur la voie 1 (jaune), puis, avec un retard Δt, sur la voie 2 (bleu).
   Les signaux ont toujours la même forme ; seul le décalage change d'un signal à l'autre.
   On mesure Δt entre deux points qui se correspondent : le DÉPART de chaque signal
   (l'endroit où il quitte sa ligne horizontale).

   'carreaux' (module_1a_carreaux.html) — sans curseur ; un appui sur l'écran trace un trait vertical :
       1. nombre de carreaux entre le départ du signal de la voie 1 et celui de la voie 2 ;
       2. Δt = nombre de carreaux × base de temps.
   'curseurs' (module_1b_curseurs.html) :
       1. Cursor, Mode : Manuel, Type : X ;
       2. CurA au départ du signal de la voie 1, CurB au départ du signal de la voie 2 ; Δt = ΔX.
   Base de temps modifiable à tout moment : tout se recalcule avec la base affichée (si elle change
   après le comptage, le comptage est à refaire). « ↺ Nouveau signal » sous le déroulé.
   ============================================================ */
(function () {
  'use strict';

  const el = OS.el, fmt = OS.fmt, NB = ' ';
  const BASES = [0.05, 0.1, 0.2, 0.5, 1];                 // ms/carreau
  const REP = 1.6;                                        // durée entre deux salves (ms)
  const FOSC = 40;                                        // fréquence des oscillations de la salve (kHz)
  const T_MAX = 4 / FOSC, T_FIN = 9 / FOSC;               // maximum et fin de la salve après son départ (ms)
  // défis « carreaux » : départs et décalage sur un nombre exact de cinquièmes de carreau (base 0,2 ms)
  const DEFIS_CAR = [
    { t1: 0.24, tau: 0.48 }, { t1: 0.28, tau: 0.56 }, { t1: 0.32, tau: 0.64 },
    { t1: 0.24, tau: 0.72 }, { t1: 0.28, tau: 0.76 }, { t1: 0.32, tau: 0.88 },
  ];
  // défis « curseurs » : décalages quelconques (les curseurs se règlent finement)
  const DEFIS_CUR = [
    { t1: 0.25, tau: 0.53 }, { t1: 0.31, tau: 0.61 }, { t1: 0.22, tau: 0.67 },
    { t1: 0.27, tau: 0.74 }, { t1: 0.35, tau: 0.83 }, { t1: 0.30, tau: 0.47 },
  ];
  const BASE0 = 0.2;
  // les deux voies : même salve, la voie 2 en retard de tau ; voie 1 en haut, voie 2 en bas
  const voies = D => [
    { signal: { forme: 'salve', debut: D.t1, rep: REP, fOsc: FOSC, ampl: 1.8 }, sens: 1, pos: 1.6 },
    { signal: { forme: 'salve', debut: D.t1 + D.tau, rep: REP, fOsc: FOSC, ampl: 1.5 }, sens: 1, pos: -2 },
  ];
  const proche = (a, b, r) => Math.abs(a - b) <= (r || 0.02) * Math.abs(b);
  const VOIE1 = '<span class="os-voie os-voie-1">voie 1</span>', VOIE2 = '<span class="os-voie os-voie-2">voie 2</span>';

  function duree(zone, type) {
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
      const D = Object.assign({ base: BASE0 }, liste[i]);
      OS.defiEnCours = D;                    // défi en cours (utile pour vérifier l'application)
      return D;
    }
    // squelette commun : écran à gauche, déroulé guidé à droite
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
    // positions (carreaux) des départs des salves d'une voie, sur l'écran et juste autour
    const departs = (debut, b) => [-1, 0, 1].map(k => (debut + k * REP) / b);

    /* ============================================================
       EN COMPTANT LES CARREAUX
       ============================================================ */
    function defiCarreaux(corps) {
      const D = tirer(DEFIS_CAR);
      const { $, Z, lis } = squelette(corps,
        `Un même signal arrive sur la ${VOIE1}, puis, plus tard, sur la ${VOIE2}. Mesure le décalage temporel Δt entre les deux signaux, en comptant les carreaux.`,
        `Touche l'écran (ou fais glisser ton doigt ou la souris)${NB}: un trait vertical en pointillés t'aide à repérer où tu es sur l'axe des temps.`,
        [`Repère le <b>départ</b> de chaque signal${NB}: l'endroit où il quitte sa ligne horizontale. Compte les <b>carreaux</b> entre le départ du signal de la voie 1 et le départ du signal de la voie 2.`,
         'Calcule <b>Δt = nombre de carreaux × base de temps</b>.']);
      let etape = 0, nC = null;
      const etapeA = n => { etape = n; OS.deroule(lis, n); };
      const ecran = OSC.monter($('ecran'), {
        voies: voies(D), baseTemps: D.base, bases: BASES, trait: 'v',
        // base changée après le comptage : le nombre de carreaux aussi, on recompte
        onBase() { if (etape === 1) compter(true); },
      });
      const b = () => ecran.o.baseTemps, u = () => OSC.unite(b()), bU = () => OSC.enU(b(), u());

      /* 1. nombre de carreaux entre les deux départs */
      function compter(baseChangee) {
        Z(0).innerHTML = baseChangee ? `<div class="callout os-info"><p>La base de temps a changé${NB}: le nombre de carreaux aussi. Recompte les carreaux.</p></div>` : '';
        Z(1).innerHTML = '';
        etapeA(0);
        ecran.effacerMotif();
        OS.question(Z(0), { parties: [{
          type: 'nombre', label: 'Nombre de carreaux entre les deux départs :', unite: 'carreaux', aria: 'Nombre de carreaux',
          verifier(v) {
            const q = D.tau / b(), s2 = (D.t1 + D.tau) / b();
            if (s2 > OSC.NX) return { format: `Le départ du signal de la voie 2 n'est pas sur l'écran${NB}: augmente la base de temps (Time).` };
            const comptable = Math.abs(q * 5 - Math.round(q * 5)) <= 0.25;
            if (!comptable && Math.abs(v - q) <= 0.3) return { format: `Avec cette base de temps, le décalage ne tombe pas sur un nombre exact de cinquièmes de carreau${NB}: change la base de temps (Time).` };
            if (Math.abs(v - q) <= 0.12) { nC = v; return { ok: true }; }
            // erreurs reconnues : on garde la plus proche de la valeur donnée
            const cas = [
              [(REP - D.tau) / b(), `La voie 2 est en retard sur la voie 1${NB}: mesure du départ du signal de la voie 1 jusqu'au départ du signal de la voie 2 <b>qui le suit</b>.`],
              [q + T_MAX / b(), `Tu as compté jusqu'au maximum d'un des signaux${NB}: place-toi au <b>même endroit</b> sur les deux signaux, au départ de chacun.`],
              [q - T_MAX / b(), `Tu as compté jusqu'au maximum d'un des signaux${NB}: place-toi au <b>même endroit</b> sur les deux signaux, au départ de chacun.`],
              [q + T_FIN / b(), `Tu as compté jusqu'à la fin d'un des signaux${NB}: place-toi au <b>même endroit</b> sur les deux signaux, au départ de chacun.`],
              [q - T_FIN / b(), `Tu as compté jusqu'à la fin d'un des signaux${NB}: place-toi au <b>même endroit</b> sur les deux signaux, au départ de chacun.`],
              [REP / b(), 'Tu as mesuré entre deux signaux de la voie 1. Mesure entre le départ du signal de la voie 1 et le départ du signal de la voie 2.'],
              [s2, 'Tu as compté depuis le bord gauche de l\'écran. Compte depuis le départ du signal de la voie 1.'],
            ].map(([x, t]) => [Math.abs(v - x), t]).filter(([e]) => e <= 0.15).sort((a, c) => a[0] - c[0]);
            if (cas.length) return { diag: cas[0][1] };
            if (proche(v, OSC.enU(D.tau, u()))) return { diag: 'Donne d\'abord le nombre de carreaux. La durée se calcule à l\'étape suivante.' };
            return { diag: `Compte les carreaux entre les deux départs, au cinquième de carreau près${NB}: sur l'axe central, un petit trait vaut 0,2 carreau.` };
          },
          solution: () => `Entre le départ du signal de la voie 1 et celui de la voie 2${NB}: ${fmt(+(D.tau / b()).toFixed(2))} carreaux.`,
          remplir(ins) {
            const q = +(D.tau / b()).toFixed(2);
            nC = q; ins[0].value = fmt(q);
            ecran.marquer(OSC.reperesX(D.t1 / b(), (D.t1 + D.tau) / b(), 0.9, 'Δt'));
          },
        }] }, { fin: calculer }, 'manip');
      }
      /* 2. Δt = nombre de carreaux × base de temps */
      function calculer() {
        etapeA(1);
        const uu = u(), T = nC * bU();
        OS.question(Z(1), { parties: [{
          type: 'nombre', label: 'Δt =', unite: uu,
          verifier(v) {
            if (proche(v, T, 0.015)) return { ok: true };
            if (proche(v, nC)) return { diag: 'Tu as donné des carreaux, pas une durée. Multiplie le nombre de carreaux par la base de temps (Time).' };
            if (proche(v, nC / bU())) return { diag: 'On multiplie le nombre de carreaux par la base de temps, on ne divise pas.' };
            if (uu === 'µs' && proche(v, T / 1000)) return { diag: `La base de temps est en µs${NB}: écris Δt en µs.` };
            if (uu === 'ms' && proche(v, T * 1000)) return { diag: `La base de temps est en ms${NB}: écris Δt en ms.` };
            return { diag: `Δt = nombre de carreaux × base de temps, avec la base de temps lue après «${NB}Time${NB}».` };
          },
          solution: () => `Δt = ${fmt(nC)} × ${fmt(bU())} ${OS.egal(T)} <b>${OS.court(T)} ${uu}</b>`,
          remplir(ins) { ins[0].value = OS.court(T).replace(/\s/g, ''); },
        }] }, { fin: terminer }, 'manip');
        OS.amener(Z(1));
      }
      function terminer() {
        etapeA(2);
        ecran.effacerMotif();
        ecran.marquer(OSC.reperesX(D.t1 / b(), (D.t1 + D.tau) / b(), 0.9, 'Δt'));
        OS.finDefi($('fin'), `La voie 2 est en retard de <b>Δt = nombre de carreaux × base de temps</b> sur la voie 1. On mesure entre deux points qui se correspondent sur les deux signaux${NB}: le départ de chacun.`,
          { fiche: 'fiche_1.html#carreaux', suite: { href: 'module_1b_curseurs.html', label: 'Utiliser les curseurs →' } }, () => afficher());
      }
      compter(false);
    }

    /* ============================================================
       EN UTILISANT LES CURSEURS
       ============================================================ */
    function defiCurseurs(corps) {
      const D = tirer(DEFIS_CUR);
      const { $, Z, lis } = squelette(corps,
        `Un même signal arrive sur la ${VOIE1}, puis, plus tard, sur la ${VOIE2}. Mesure le décalage temporel Δt entre les deux signaux avec les curseurs de l'oscilloscope.`,
        `Appuie sur <b>Cursor</b>, règle le menu avec les boutons à droite de l'écran, choisis <b>CurA</b> et/ou <b>CurB</b>, puis tourne le <b>bouton de réglage</b> (ou appuie sur sa moitié gauche ou droite).`,
        [`Appuie sur <b>Cursor</b>, puis règle <b>Mode${NB}: Manuel</b> (1<sup>er</sup> bouton à droite de l'écran) et vérifie <b>Type${NB}: X</b> (2<sup>e</sup> bouton)${NB}: curseurs horizontaux, pour mesurer une durée.`,
         `Choisis <b>CurA</b> (4<sup>e</sup> bouton) et tourne le <b>bouton de réglage</b> pour placer le curseur A au <b>départ</b> du signal de la voie 1. Choisis ensuite <b>CurB</b> (5<sup>e</sup> bouton) et place le curseur B au <b>départ</b> du signal de la voie 2. Lis <b>ΔX</b> sous l'écran.`]);
      let etape = 0;
      OS.deroule(lis, 0);
      const ecran = OSC.monter($('ecran'), {
        voies: voies(D), baseTemps: D.base, bases: BASES, curseurs: true,
        onChange(st) { if (etape === 0 && st.menu && st.mode === 'Manuel' && st.type === 'X') { etape = 1; OS.deroule(lis, 1); mesurer(); } },
        // l'unité de Δt suit la base de temps
        onBase() { const s = Z(1).querySelector('.os-unite'); if (s && etape === 1) s.textContent = u(); },
      });
      const b = () => ecran.o.baseTemps, u = () => OSC.unite(b());

      // diagnostic sur la position des curseurs (null si elle convient)
      function positions() {
        const m = ecran.mesure(), tol = 0.12;
        const S1 = departs(D.t1, b()), S2 = departs(D.t1 + D.tau, b());
        const pres = (c, liste, r) => liste.some(x => Math.abs(c - x) <= (r || tol));
        const sur1 = c => pres(c, S1), sur2 = c => pres(c, S2);
        const ecart = Math.abs(m.b - m.a);
        if (((sur1(m.a) && sur2(m.b)) || (sur2(m.a) && sur1(m.b))) && Math.abs(ecart - D.tau / b()) <= 2 * tol) return null;
        const auMax = c => pres(c, S1.concat(S2).map(x => x + T_MAX / b()), 0.18);
        const aLaFin = c => pres(c, S1.concat(S2).map(x => x + T_FIN / b()), 0.18);
        if (auMax(m.a) || auMax(m.b)) return `Un curseur est sur le maximum d'un signal${NB}: place les deux curseurs au <b>même endroit</b> sur les deux signaux, au départ de chacun (là où il quitte sa ligne horizontale).`;
        if (aLaFin(m.a) || aLaFin(m.b)) return `Un curseur est à la fin d'un signal${NB}: place les deux curseurs au <b>même endroit</b> sur les deux signaux, au départ de chacun.`;
        if (sur1(m.a) && sur1(m.b)) return 'Les deux curseurs sont au départ de signaux de la voie 1. Place l\'un au départ du signal de la voie 1, l\'autre au départ du signal de la voie 2.';
        if (sur2(m.a) && sur2(m.b)) return 'Les deux curseurs sont au départ de signaux de la voie 2. Place l\'un au départ du signal de la voie 1, l\'autre au départ du signal de la voie 2.';
        if ((sur1(m.a) && sur2(m.b)) || (sur2(m.a) && sur1(m.b))) return `La voie 2 est en retard sur la voie 1${NB}: mesure du départ du signal de la voie 1 jusqu'au départ du signal de la voie 2 <b>qui le suit</b>.`;
        return `Place un curseur exactement au départ du signal de la voie 1 et l'autre au départ du signal de la voie 2${NB}: là où chaque signal quitte sa ligne horizontale.`;
      }
      /* 2. curseurs aux deux départs, Δt = ΔX */
      function mesurer() {
        OS.question(Z(1), { parties: [{
          type: 'nombre', label: 'Δt = ΔX =', unite: u(),
          verifier(v) {
            const m = ecran.mesure();
            if (!m.actifs || m.type !== 'X') return { format: `Affiche d'abord les curseurs de temps${NB}: appuie sur <b>Cursor</b>, puis règle <b>Mode${NB}: Manuel</b> et <b>Type${NB}: X</b>.` };
            const d = positions();
            if (d) return { diag: d };
            const L = ecran.lecture();
            if (proche(v, L.delta, 0.006) || proche(v, OSC.enU(D.tau, u()), 0.015)) return { ok: true };
            if (proche(v, Math.abs(L.va), 0.006) || proche(v, Math.abs(L.vb), 0.006)) return { diag: 'Tu as recopié la valeur d\'un curseur. Δt est l\'écart entre les deux curseurs, ΔX.' };
            if (u() === 'µs' && proche(v, L.delta / 1000)) return { diag: `ΔX est affiché en µs${NB}: écris Δt en µs.` };
            if (u() === 'ms' && proche(v, L.delta * 1000)) return { diag: `ΔX est affiché en ms${NB}: écris Δt en ms.` };
            return { diag: `Lis ΔX sous l'écran${NB}: c'est la durée entre les deux curseurs.` };
          },
          solution: () => { const L = ecran.lecture(); return `Les curseurs sont aux départs des deux signaux${NB}: Δt = ΔX = <b>${L.dec ? fmt(L.delta, L.dec) : fmt(Math.round(L.delta))} ${L.u}</b>.`; },
          remplir(ins) {
            ecran.ouvrirCurseurs('X');
            ecran.poser(D.t1 / b(), (D.t1 + D.tau) / b());
            const L = ecran.lecture();
            ins[0].value = L.dec ? fmt(L.delta, L.dec) : String(Math.round(L.delta));
          },
        }] }, { fin: terminer }, 'manip');
        OS.amener(Z(1));
      }
      function terminer() {
        etape = 2; OS.deroule(lis, 2);
        ecran.verrouiller();
        OS.finDefi($('fin'), `Les curseurs se placent au <b>même endroit</b> sur les deux signaux (le départ de chacun)${NB}: le décalage de la voie 2 sur la voie 1 est <b>Δt = ΔX</b>.`,
          { fiche: 'fiche_1.html#curseurs', suite: { href: 'module_2a_carreaux.html', label: `Module 2${NB}: mesurer une fréquence →` } }, () => afficher());
      }
    }
    afficher();
  }

  OS.duree = duree;
})();
