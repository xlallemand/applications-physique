/* ============================================================
   Module 3 : écran d'oscilloscope (simulation)
   PF.simulation(zone)
   - Défi (fréquence du signal masquée), déroulé guidé :
       1. compter les carreaux de n périodes (curseurs) — ou règle et tableau ;
       2. T = (nombre de carreaux × base de temps) / n ;
       3. changer la base de temps : T ne change pas ;
       4. f = 1 / T ;
       5. bilan à cocher : T = nombre de carreaux × base de temps.
   - Réglage libre : forme et fréquence du signal, base de temps, curseurs.
   ============================================================ */
(function () {
  'use strict';

  const el = PF.el, fmt = PF.fmt;
  const BASES = [0.1, 0.2, 0.5, 1, 2, 5];                    // ms/carreau
  const SENS = 2;                                           // V/carreau
  // phase qui place le sommet principal à la position c (carreaux) pour la base b
  const ph = (forme, T, b, c) => PF.phaseSommet(forme, T, c * b);
  // défis : période (ms), base de temps de départ ; les uns se lisent au dixième de carreau, les autres non
  const DEFIS = [
    { forme: 'sinus', periode: 2, base: 0.5, sommet: 1 },
    { forme: 'clarinette', periode: 4, base: 1, sommet: 1 },
    { forme: 'trompette', periode: 1.25, base: 0.2, sommet: 0.5 },
    { forme: 'sinus', periode: 2.27, base: 0.5, sommet: 0.8 },
    { forme: 'clarinette', periode: 5, base: 1, sommet: 0 },
    { forme: 'sinus', periode: 0.8, base: 0.2, sommet: 0.6 },
  ];
  const FORMES = [{ id: 'sinus', nom: 'Sinusoïde' }, { id: 'clarinette', nom: 'Son de clarinette' }, { id: 'trompette', nom: 'Son de trompette' }];
  const FREQS = [50, 100, 125, 200, 250, 400, 440, 500, 800, 1000, 1250, 2000, 2500, 5000];

  function simulation(zone) {
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
        defi(corps);
      } else libre(corps);
    }

    /* ============================================================
       DÉFI GUIDÉ
       ============================================================ */
    function defi(corps) {
      let i;
      do { i = Math.floor(Math.random() * DEFIS.length); } while (i === dernier);
      dernier = i;
      const D = DEFIS[i];
      const sit = { signal: { forme: D.forme, periode: D.periode, ampl: 4.4, phase: ph(D.forme, D.periode, D.base, D.sommet) }, baseTemps: D.base, sensibilite: SENS };
      corps.innerHTML = `<div class="pf-manip pf-manip-osc">
          <div class="pf-manip-fig"><p class="pf-fig-t">Un générateur délivre un signal dont la fréquence est masquée. Mesure sa période sur l'écran.</p><div data-a="fig"></div></div>
          <div class="pf-manip-panneau">
            <ol class="pf-deroule">
              <li data-e="0"><span>Compte les carreaux de <b>n périodes</b> (le plus grand nombre lisible).</span><div class="pf-li-zone" data-z="0"></div></li>
              <li data-e="1"><span>Calcule <b>T = (nombre de carreaux × base de temps) / n</b>.</span><div class="pf-li-zone" data-z="1"></div></li>
              <li data-e="2"><span>Change la <b>base de temps</b> (boutons − / + sous l'écran).</span><div class="pf-li-zone" data-z="2"></div></li>
              <li data-e="3"><span>Calcule la fréquence <b>f = 1 / T</b>.</span><div class="pf-li-zone" data-z="3"></div></li>
              <li data-e="4"><span>Bilan : coche la bonne relation.</span><div class="pf-li-zone" data-z="4"></div></li>
            </ol>
            <div data-a="fin"></div>
          </div>
        </div>`;
      const $ = a => corps.querySelector(`[data-a="${a}"]`), Z = k => corps.querySelector(`[data-z="${k}"]`);
      const lis = corps.querySelectorAll('.pf-deroule li');
      let etape = 0;
      function deroule(n) {
        etape = n;
        lis.forEach((li, k) => { li.classList.toggle('fait', k < n); li.classList.toggle('ici', k === n); li.classList.toggle('avenir', k > n); });
      }
      deroule(0);
      let T = null, base0 = D.base;
      const champsZ = el('div');
      Z(0).appendChild(champsZ);
      const oq = OSC.question({ figure: $('fig'), champs: champsZ }, sit, {
        bases: BASES,
        onPhase(n) { if (n === 'compte') { deroule(1); Z(1).appendChild(champsZ.querySelector('[data-a="pT"]')); Z(1).appendChild(champsZ.querySelector('[data-a="msg"]')); } },
        onBase(b) { if (etape === 2) baseChangee(b); },
        onFini(t, info) {
          T = t;
          if (info.methode === 'regle') { oq.afficherEcran(); Z(1).innerHTML = `<p class="ph-ok">✓ T ≈ ${fmt(+t.toPrecision(3))} ms</p>`; }
          oq.activerBase(true);
          deroule(2);
          Z(2).innerHTML = '<p class="pf-li-aide">Observe la trace quand tu changes la base de temps.</p>';
          PF.defiler(Z(2));
        },
      });
      oq.activerBase(false);
      // règle et tableau : le comptage se fait sous l'écran
      const noteRegle = el('p', 'pf-li-aide', 'Avec la règle : mesure l\'échelle (des carreaux) et n périodes, puis remplis le tableau et le calcul sous l\'écran.');
      Z(0).appendChild(noteRegle);
      const majNote = () => { noteRegle.hidden = oq.methode() !== 'regle'; };
      $('fig').addEventListener('click', () => setTimeout(majNote, 0));
      majNote();

      /* 3. la base de temps change, pas la période */
      let pose = false;
      function baseChangee(b) {
        if (pose) return;
        pose = true;
        oq.activerBase(false);
        const n0 = T / base0, n1 = T / b;
        PF.question(Z(2), { parties: [{
          type: 'choix', colonne: true,
          q: `La base de temps vaut maintenant ${fmt(b)} ms/carreau. La période T du signal a-t-elle changé ?`,
          options: [
            { id: 'non', label: 'Non : T est la même, seul l\'affichage a changé.' },
            { id: 'plus', label: `Oui : T a ${b > base0 ? 'diminué' : 'augmenté'}, le motif est plus ${b > base0 ? 'serré' : 'étalé'}.` },
            { id: 'moins', label: `Oui : T a ${b > base0 ? 'augmenté' : 'diminué'}, chaque carreau vaut ${b > base0 ? 'plus' : 'moins'} de temps.` },
          ],
          bonne: 'non',
          indice: 'Le signal du générateur n\'a pas changé : seule l\'échelle de l\'écran a changé. Le nombre de carreaux d\'une période change, mais chaque carreau vaut une autre durée.',
          solution: `Avec ${fmt(base0)} ms/carreau, une période occupe ${fmt(+n0.toFixed(2))} carreaux ; avec ${fmt(b)} ms/carreau, ${fmt(+n1.toFixed(2))} carreaux. ${fmt(+n0.toFixed(2))} × ${fmt(base0)} = ${fmt(+n1.toFixed(2))} × ${fmt(b)} = ${fmt(+T.toPrecision(3))} ms : <b>la période ne dépend pas de la base de temps</b>.`,
        }] }, { fin() { oq.activerBase(true); deroule(3); frequence(); } }, 'manip');
        PF.defiler(Z(2));
      }

      /* 4. f = 1 / T */
      function frequence() {
        PF.question(Z(3), { parties: PF.partiesFrequence({ T: +T.toPrecision(3), unite: 'ms', exact: D.periode }) }, {
          fin() { deroule(4); bilan(); },
        }, 'manip');
        PF.defiler(Z(3));
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
            sens: 'La sensibilité verticale (V/carreau) sert aux tensions, lues verticalement. Une durée se lit horizontalement, avec la base de temps.',
            div: 'La base de temps est la durée d\'un carreau (ms/carreau) : on multiplie le nombre de carreaux par la durée d\'un carreau.',
            dep: 'Tu viens de le voir : en changeant la base de temps, la période ne change pas.',
          },
        }] }, {
          fin() {
            deroule(5);
            SOM.marquer({ fait: true });
            $('fin').innerHTML = `<div class="cle pf-bilan"><p><b class="cle-titre">Bilan.</b> <b>T = nombre de carreaux × base de temps</b> (pour une période ; pour n périodes, on divise ensuite par n). La base de temps change l'affichage, pas le signal. Puis f = 1 / T, avec T en secondes.</p></div>
              <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Nouveau défi</button>
              <a class="btn-primary" style="text-decoration:none" href="module_4_questions.html">Module 4 : entraînement →</a></div>`;
            $('fin').querySelector('[data-a="re"]').onclick = () => afficher();
            PF.defiler($('fin'));
          },
        }, 'manip');
        PF.defiler(Z(4));
      }
    }

    /* ============================================================
       RÉGLAGE LIBRE
       ============================================================ */
    function libre(corps) {
      const st = { forme: 'sinus', f: 500, base: 0.5 };
      corps.innerHTML = `<div class="pf-manip pf-manip-osc">
          <div class="pf-manip-fig"><div data-a="ecran"></div>
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
          </div>
          <div class="pf-manip-panneau">
            <div class="osc-reglage"><span class="osc-base-t">Signal</span>
              <select class="osc-select" data-a="forme" aria-label="Forme du signal">${FORMES.map(x => `<option value="${x.id}">${x.nom}</option>`).join('')}</select></div>
            <div class="osc-reglage"><span class="osc-base-t">Fréquence du générateur</span>
              <button type="button" class="btn-secondary osc-fl" data-a="fMoins" aria-label="Fréquence plus petite">−</button>
              <span class="osc-val" data-a="f"></span>
              <button type="button" class="btn-secondary osc-fl" data-a="fPlus" aria-label="Fréquence plus grande">+</button></div>
            <div class="osc-reglage"><span class="osc-base-t">Base de temps</span>
              <button type="button" class="btn-secondary osc-fl" data-a="bMoins" aria-label="Base de temps plus petite">−</button>
              <select class="osc-select" data-a="bSel" aria-label="Base de temps">${BASES.map(b => `<option value="${b}">${fmt(b)} ms/carreau</option>`).join('')}</select>
              <button type="button" class="btn-secondary osc-fl" data-a="bPlus" aria-label="Base de temps plus grande">+</button></div>
            <div class="callout pf-lecture" data-a="lecture" aria-live="polite"></div>
            <p class="pf-li-aide">Change la fréquence : le motif se resserre ou s'étale. Change la base de temps : l'affichage change, pas le signal.</p>
          </div>
        </div>`;
      const $ = a => corps.querySelector(`[data-a="${a}"]`);
      const sig = () => ({ forme: st.forme, periode: 1000 / st.f, ampl: 4.4, phase: 0 });
      const ecran = OSC.monter($('ecran'), { signal: sig(), baseTemps: st.base, sensibilite: SENS, curseurs: true, onChange(e) { majCur(e.sel); lecture(); } });
      const majCur = s => corps.querySelectorAll('.osc-cur-b').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.c === s)));
      corps.querySelectorAll('.osc-cur-b').forEach(b => { b.onclick = () => ecran.choisir(+b.dataset.c); });
      $('moins').onclick = () => ecran.deplacer(-1);
      $('plus').onclick = () => ecran.deplacer(1);
      function lecture() {
        const [a, b] = ecran.curseurs(), c = +(b - a).toFixed(1), T = 1000 / st.f;
        $('lecture').innerHTML = `<p>Entre les curseurs : <b>${fmt(c)} carreaux</b>, soit ${fmt(c)} × ${fmt(st.base)} = <b>${fmt(+(c * st.base).toPrecision(3))} ms</b>.</p>
          <p>Période du signal : T = 1 / f = <b>${fmt(+T.toPrecision(3))} ms</b>, soit ${fmt(+(T / st.base).toFixed(2))} carreaux à ${fmt(st.base)} ms/carreau.</p>`;
      }
      function maj() {
        $('f').textContent = fmt(st.f) + ' Hz';
        $('bSel').value = String(st.base);
        ecran.maj({ signal: sig(), baseTemps: st.base });
        lecture();
      }
      $('forme').onchange = () => { st.forme = $('forme').value; maj(); };
      $('fMoins').onclick = () => { const k = FREQS.indexOf(st.f); if (k > 0) { st.f = FREQS[k - 1]; maj(); } };
      $('fPlus').onclick = () => { const k = FREQS.indexOf(st.f); if (k < FREQS.length - 1) { st.f = FREQS[k + 1]; maj(); } };
      $('bSel').onchange = () => { st.base = +$('bSel').value; maj(); };
      $('bMoins').onclick = () => { const k = BASES.indexOf(st.base); if (k > 0) { st.base = BASES[k - 1]; maj(); } };
      $('bPlus').onclick = () => { const k = BASES.indexOf(st.base); if (k < BASES.length - 1) { st.base = BASES[k + 1]; maj(); } };
      maj();
    }
    afficher();
  }

  PF.simulation = simulation;
})();
