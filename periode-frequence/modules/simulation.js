/* ============================================================
   Module 3 : l'oscilloscope (deux simulateurs)
   PF.simulation(zone, 'carreaux' | 'curseurs')

   'carreaux' (module_3a_carreaux.html) — sans curseur ; un appui sur l'écran trace un trait
     vertical en pointillés. Défi (fréquence masquée), déroulé guidé :
       1. compter les carreaux de n périodes, et n ;
       2. T = (nombre de carreaux × base de temps) / n ;
       3. changer la base de temps : T ne change pas ;
       4. f = 1 / T ;
       5. bilan à cocher.
   'curseurs' (module_3b_curseurs.html) — réglages comme sur l'appareil de la notice :
       1. Cursor, Mode : Manuel, Type : X ;
       2. curseurs A et B (CurA, CurB, bouton de réglage), n, T = ΔX / n ;
       3. f = 1 / T.
   Dans les deux simulateurs, un « Réglage libre » : forme et fréquence du signal, base de temps.
   ============================================================ */
(function () {
  'use strict';

  const el = PF.el, fmt = PF.fmt;
  const BASES = [0.1, 0.2, 0.5, 1, 2, 5];                    // ms/carreau
  const SENS = 2;                                           // V/carreau
  // phase qui place le sommet principal à la position c (carreaux) pour la base b
  const ph = (forme, T, b, c) => PF.phaseSommet(forme, T, c * b);
  // défis « carreaux » : n périodes tombent sur un nombre exact de carreaux
  const DEFIS_CAR = [
    { forme: 'sinus', periode: 2, base: 0.5, sommet: 1 },
    { forme: 'clarinette', periode: 4, base: 1, sommet: 1 },
    { forme: 'trompette', periode: 1.2, base: 0.2, sommet: 1 },
    { forme: 'sinus', periode: 0.8, base: 0.2, sommet: 0.6 },
    { forme: 'clarinette', periode: 5, base: 1, sommet: 0 },
    { forme: 'sinus', periode: 2.5, base: 0.5, sommet: 0 },
  ];
  // défis « curseurs » : périodes quelconques (les curseurs se règlent finement)
  const DEFIS_CUR = [
    { forme: 'sinus', periode: 2.27, base: 0.5, sommet: 0.8 },
    { forme: 'clarinette', periode: 2.9, base: 0.5, sommet: 0.5 },
    { forme: 'trompette', periode: 1.25, base: 0.2, sommet: 0.5 },
    { forme: 'clarinette', periode: 3.7, base: 1, sommet: 1.2 },
    { forme: 'sinus', periode: 0.42, base: 0.1, sommet: 0.7 },
    { forme: 'trompette', periode: 6.4, base: 2, sommet: 0.4 },
  ];
  const FORMES = [{ id: 'sinus', nom: 'Sinusoïde' }, { id: 'clarinette', nom: 'Son de clarinette' }, { id: 'trompette', nom: 'Son de trompette' }];
  const FREQS = [50, 100, 125, 200, 250, 400, 440, 500, 800, 1000, 1250, 2000, 2500, 5000];
  const deroule = (lis, n) => lis.forEach((li, k) => { li.classList.toggle('fait', k < n); li.classList.toggle('ici', k === n); li.classList.toggle('avenir', k > n); });

  function simulation(zone, type) {
    let mode = 'defi', dernier = -1;
    function afficher() {
      zone.innerHTML = '';
      const carte = el('div', 'er-card');
      carte.innerHTML = `<div class="pf-sit-tete"><div class="pf-mode" role="radiogroup" aria-label="Mode">
          <button type="button" role="radio" class="lg-meth" data-m="defi" aria-checked="${mode === 'defi'}">Défi : fréquence masquée</button>
          <button type="button" role="radio" class="lg-meth" data-m="libre" aria-checked="${mode === 'libre'}">Réglage libre</button></div>
          ${mode === 'defi' ? '<button type="button" class="btn-small" data-a="nouveau">↺ Nouveau défi</button>' : ''}</div>
        <div data-a="corps"></div>`;
      zone.appendChild(carte);
      carte.querySelectorAll('.lg-meth').forEach(b => { b.onclick = () => { if (mode !== b.dataset.m) { mode = b.dataset.m; afficher(); } }; });
      const corps = carte.querySelector('[data-a="corps"]');
      if (mode === 'defi') {
        carte.querySelector('[data-a="nouveau"]').onclick = () => afficher();
        (type === 'curseurs' ? defiCurseurs : defiCarreaux)(corps);
      } else libre(corps);
    }
    function tirer(liste) {
      let i;
      do { i = Math.floor(Math.random() * liste.length); } while (i === dernier && liste.length > 1);
      dernier = i;
      const D = liste[i];
      PF.defiEnCours = D;                    // défi en cours (utile pour vérifier l'application)
      return { D, sit: { signal: { forme: D.forme, periode: D.periode, ampl: 4.4, phase: ph(D.forme, D.periode, D.base, D.sommet) }, baseTemps: D.base, sensibilite: SENS } };
    }
    // fin du défi : bilan, liens
    function finDefi(fin, bilan, suite) {
      SOM.marquer({ fait: true });
      fin.innerHTML = `<div class="cle pf-bilan"><p><b class="cle-titre">Bilan.</b> ${bilan}</p></div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Nouveau défi</button>
        <a class="btn-secondary" style="text-decoration:none" href="fiche_3.html">Fiche récapitulative</a>
        <a class="btn-primary" style="text-decoration:none" href="${suite.href}">${suite.label}</a></div>`;
      fin.querySelector('[data-a="re"]').onclick = () => afficher();
      PF.amener(fin);
    }
    // T en secondes puis f = 1 / T
    function frequence(zoneF, info, D, fin) {
      PF.question(zoneF, { parties: PF.partiesFrequence({ T: +info.Tu.toPrecision(3), unite: info.unite, exact: OSC.enU(D.periode, info.unite) }) }, { fin }, 'manip');
      PF.amener(zoneF);
    }

    /* ============================================================
       DÉFI : EN COMPTANT LES CARREAUX
       ============================================================ */
    function defiCarreaux(corps) {
      const { D, sit } = tirer(DEFIS_CAR);
      corps.innerHTML = `<div class="pf-manip pf-manip-osc">
          <div class="pf-manip-fig"><p class="pf-fig-t">Un générateur délivre un signal dont la fréquence est masquée. Mesure sa période sur l'écran, en comptant les carreaux.</p><div data-a="fig"></div></div>
          <div class="pf-manip-panneau">
            <ol class="pf-deroule">
              <li><span>Compte les carreaux de <b>n périodes</b> (le plus grand nombre lisible).</span><div class="pf-li-zone" data-z="0"></div></li>
              <li><span>Calcule <b>T = (nombre de carreaux × base de temps) / n</b>.</span><div class="pf-li-zone" data-z="1"></div></li>
              <li><span>Change la <b>base de temps</b> (boutons − / + sous l'oscilloscope).</span><div class="pf-li-zone" data-z="2"></div></li>
              <li><span>Calcule la fréquence <b>f = 1 / T</b>.</span><div class="pf-li-zone" data-z="3"></div></li>
              <li><span>Bilan : coche la bonne relation.</span><div class="pf-li-zone" data-z="4"></div></li>
            </ol>
            <div data-a="fin"></div>
          </div>
        </div>`;
      const $ = a => corps.querySelector(`[data-a="${a}"]`), Z = k => corps.querySelector(`[data-z="${k}"]`);
      const lis = corps.querySelectorAll('.pf-deroule li');
      let etape = 0;
      const etapeA = n => { etape = n; deroule(lis, n); };
      etapeA(0);
      let info = null;
      const base0 = D.base;
      const champsZ = el('div');
      Z(0).appendChild(champsZ);
      const oq = OSC.question({ figure: $('fig'), champs: champsZ }, sit, {
        methodes: ['carreaux'], bases: BASES,
        onPhase(n) { if (n === 'compte') { etapeA(1); Z(1).appendChild(champsZ.querySelector('[data-a="pT"]')); Z(1).appendChild(champsZ.querySelector('[data-a="msg"]')); } },
        onBase(b) { if (etape === 2) baseChangee(b); },
        onFini(t, inf) {
          info = inf;
          oq.activerBase(true);
          etapeA(2);
          Z(2).innerHTML = '<p class="pf-li-aide">Observe la trace quand tu changes la base de temps.</p>';
          PF.amener(Z(2));
        },
      });
      oq.activerBase(false);

      /* 3. la base de temps change, pas la période */
      let pose = false;
      function baseChangee(b) {
        if (pose) return;
        pose = true;
        oq.activerBase(false);
        const n0 = D.periode / base0, n1 = D.periode / b, u = info.unite;
        PF.question(Z(2), { parties: [{
          type: 'choix', colonne: true,
          q: `La base de temps vaut maintenant ${OSC.baseTexte(b)} par carreau. La période T du signal a-t-elle changé ?`,
          options: [
            { id: 'non', label: 'Non : T est la même, seul l\'affichage a changé.' },
            { id: 'plus', label: `Oui : T a ${b > base0 ? 'diminué' : 'augmenté'}, le motif est plus ${b > base0 ? 'serré' : 'étalé'}.` },
            { id: 'moins', label: `Oui : T a ${b > base0 ? 'augmenté' : 'diminué'}, chaque carreau vaut ${b > base0 ? 'plus' : 'moins'} de temps.` },
          ],
          bonne: 'non',
          indice: 'Le signal du générateur n\'a pas changé : seule l\'échelle de l\'écran a changé. Le nombre de carreaux d\'une période change, mais chaque carreau vaut une autre durée.',
          solution: `Avec ${OSC.baseTexte(base0)} par carreau, une période occupe ${fmt(+n0.toFixed(2))} carreaux ; avec ${OSC.baseTexte(b)} par carreau, ${fmt(+n1.toFixed(2))} carreaux. Dans les deux cas, T = ${PF.court(OSC.enU(D.periode, u))} ${u} : <b>la période ne dépend pas de la base de temps</b>.`,
        }] }, { fin() { oq.activerBase(true); etapeA(3); frequence(Z(3), info, D, () => { etapeA(4); bilan(); }); } }, 'manip');
        PF.amener(Z(2));
      }

      /* 5. bilan à cocher */
      function bilan() {
        PF.question(Z(4), { parties: [{
          type: 'choix', colonne: true,
          q: 'Quelle relation permet de trouver la période sur un écran d\'oscilloscope ?',
          options: [
            { id: 'ok', label: 'T = nombre de carreaux d\'une période × base de temps' },
            { id: 'sens', label: 'T = nombre de carreaux d\'une période × sensibilité verticale' },
            { id: 'div', label: 'T = nombre de carreaux d\'une période / base de temps' },
            { id: 'dep', label: 'T dépend de la base de temps choisie' },
          ],
          bonne: 'ok',
          indices: {
            sens: 'La sensibilité verticale (CH1, en V/carreau) sert aux tensions, lues verticalement. Une durée se lit horizontalement, avec la base de temps (Time).',
            div: 'La base de temps est la durée d\'un carreau : on multiplie le nombre de carreaux par la durée d\'un carreau.',
            dep: 'Tu viens de le voir : en changeant la base de temps, la période ne change pas.',
          },
        }] }, {
          fin() {
            etapeA(5);
            finDefi($('fin'), '<b>T = nombre de carreaux × base de temps</b> (pour une période ; pour n périodes, on divise ensuite par n). La base de temps change l\'affichage, pas le signal. Puis f = 1 / T, avec T en secondes.',
              { href: 'module_3b_curseurs.html', label: 'Utiliser les curseurs →' });
          },
        }, 'manip');
        PF.amener(Z(4));
      }
    }

    /* ============================================================
       DÉFI : EN UTILISANT LES CURSEURS
       ============================================================ */
    function defiCurseurs(corps) {
      const { D, sit } = tirer(DEFIS_CUR);
      corps.innerHTML = `<div class="pf-manip pf-manip-osc">
          <div class="pf-manip-fig"><p class="pf-fig-t">Un générateur délivre un signal dont la fréquence est masquée. Mesure sa période avec les curseurs de l'oscilloscope.</p><div data-a="fig"></div></div>
          <div class="pf-manip-panneau">
            <ol class="pf-deroule">
              <li><span>Appuie sur <b>Cursor</b>, puis règle <b>Mode : Manuel</b> (1<sup>er</sup> bouton à droite de l'écran) et vérifie <b>Type : X</b> (2<sup>e</sup> bouton) : curseurs horizontaux, pour mesurer une durée.</span><div class="pf-li-zone" data-z="0"></div></li>
              <li><span>Choisis <b>CurA</b> (4<sup>e</sup> bouton) et tourne le <b>bouton de réglage</b> pour placer le curseur A sur un sommet. Choisis ensuite <b>CurB</b> (5<sup>e</sup> bouton) et place le curseur B <b>n périodes</b> plus loin (le plus grand nombre possible). Lis <b>ΔX</b> sous l'écran.</span><div class="pf-li-zone" data-z="1"></div></li>
              <li><span>Calcule la fréquence <b>f = 1 / T</b>.</span><div class="pf-li-zone" data-z="2"></div></li>
            </ol>
            <p class="pf-li-aide">Astuce : CurA et CurB choisis ensemble bougent en même temps.</p>
            <div data-a="fin"></div>
          </div>
        </div>`;
      const $ = a => corps.querySelector(`[data-a="${a}"]`), Z = k => corps.querySelector(`[data-z="${k}"]`);
      const lis = corps.querySelectorAll('.pf-deroule li');
      let etape = 0;
      deroule(lis, 0);
      const oq = OSC.question({ figure: $('fig'), champs: Z(1) }, sit, {
        methodes: ['curseurs'],
        // 1. réglages faits : on passe aux curseurs
        onChange(st) { if (etape === 0 && st.menu && st.mode === 'Manuel' && st.type === 'X') { etape = 1; deroule(lis, 1); PF.amener(Z(1)); } },
        onFini(t, info) {
          etape = 2; deroule(lis, 2);
          frequence(Z(2), info, D, () => {
            deroule(lis, 3);
            finDefi($('fin'), 'Avec les curseurs : <b>Cursor</b>, <b>Mode : Manuel</b>, <b>Type : X</b>, puis CurA et CurB sur deux points qui se correspondent, n périodes plus loin. L\'oscilloscope affiche <b>ΔX</b>, la durée entre les curseurs : <b>T = ΔX / n</b>. Puis f = 1 / T, avec T en secondes.',
              { href: 'module_4_questions.html', label: 'Module 4 : entraînement →' });
          });
        },
      });
      oq.activerBase(false);
    }

    /* ============================================================
       RÉGLAGE LIBRE
       ============================================================ */
    function libre(corps) {
      const st = { forme: 'sinus', f: 500, base: 0.5 };
      corps.innerHTML = `<div class="pf-manip pf-manip-osc">
          <div class="pf-manip-fig"><div data-a="ecran"></div></div>
          <div class="pf-manip-panneau">
            <div class="osc-reglage"><span class="osc-base-t">Signal</span>
              <select class="osc-select" data-a="forme" aria-label="Forme du signal">${FORMES.map(x => `<option value="${x.id}">${x.nom}</option>`).join('')}</select></div>
            <div class="osc-reglage"><span class="osc-base-t">Fréquence du générateur</span>
              <button type="button" class="btn-secondary osc-fl" data-a="fMoins" aria-label="Fréquence plus petite">−</button>
              <span class="osc-val" data-a="f"></span>
              <button type="button" class="btn-secondary osc-fl" data-a="fPlus" aria-label="Fréquence plus grande">+</button></div>
            <div class="callout pf-lecture" data-a="lecture" aria-live="polite"></div>
            <p class="pf-li-aide">Change la fréquence : le motif se resserre ou s'étale. Change la base de temps : l'affichage change, pas le signal.</p>
          </div>
        </div>`;
      const $ = a => corps.querySelector(`[data-a="${a}"]`);
      const sig = () => ({ forme: st.forme, periode: 1000 / st.f, ampl: 4.4, phase: 0 });
      const ecran = OSC.monter($('ecran'), { signal: sig(), baseTemps: st.base, sensibilite: SENS, bases: BASES,
        curseurs: type === 'curseurs', trait: type !== 'curseurs',
        onBase(b) { st.base = b; lecture(); } });
      function lecture() {
        const T = 1000 / st.f, u = OSC.unite(st.base);
        $('lecture').innerHTML = `<p>Période du signal : T = 1 / f = <b>${PF.court(OSC.enU(T, u))} ${u}</b>.</p>
          <p>Base de temps : ${OSC.baseTexte(st.base)} par carreau, donc une période occupe ${fmt(+(T / st.base).toFixed(2))} carreaux.</p>`;
      }
      function maj() { $('f').textContent = fmt(st.f) + ' Hz'; ecran.maj({ signal: sig() }); lecture(); }
      $('forme').onchange = () => { st.forme = $('forme').value; maj(); };
      $('fMoins').onclick = () => { const k = FREQS.indexOf(st.f); if (k > 0) { st.f = FREQS[k - 1]; maj(); } };
      $('fPlus').onclick = () => { const k = FREQS.indexOf(st.f); if (k < FREQS.length - 1) { st.f = FREQS[k + 1]; maj(); } };
      maj();
    }
    afficher();
  }

  PF.simulation = simulation;
})();
