/* ============================================================
   Module 2 : mesurer T et calculer f (manipulation guidée)
   PF.mesure(zone)
   Progressivité en trois étapes, une seule fois (6 situations) :
     1. une période, lecture directe (situations 1 et 2) ;
     2. plusieurs périodes, lecture directe (situations 3 et 4) ;
     3. règle et tableau de proportionnalité (situations 5 et 6).
   Méthode imposée dans chaque situation (l'autre est grisée)
   (LG.poserQuestion, options choixMethode et methodes) ; la lecture directe n'est acceptée que si
   elle est nette. Situation 5 : une période (case « T ») ; situation 6 : quatre périodes (repère et
   case « 4T »). Chaque situation finit par T en secondes puis f = 1 / T (PF.partiesFrequence).
   Fin du module : lien vers la fiche récapitulative (fiche_2.html).
   ============================================================ */
(function () {
  'use strict';

  const el = PF.el, fmt = PF.fmt;
  const axe = (max, pas, unite) => ({ min: 0, max, pas, nom: 't', unite: unite || 'ms', libelle: 't' });
  const AY = { min: -1.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'V' };
  const phaseSommet = PF.phaseSommet;

  const ETAPES = {
    1: { titre: 'Étape 1 · une période', texte: 'La période tombe sur des valeurs écrites de l\'axe : touche le début et la fin d\'<b>une</b> période, lis les deux dates sur l\'axe, puis écris T = t<sub>2</sub> − t<sub>1</sub>.' },
    2: { titre: 'Étape 2 · plusieurs périodes', texte: 'Une seule période ne tombe pas sur des valeurs écrites, mais <b>plusieurs périodes</b> oui : mesure la durée Δt de n périodes, puis T = Δt / n. La mesure est aussi plus précise.' },
    3: { titre: 'Étape 3 · la règle et le tableau', texte: 'Aucune période ne tombe sur des valeurs écrites : mesure à la <b>règle</b> l\'échelle et la durée repérée en orange sur le graphique, puis utilise le <b>tableau de proportionnalité</b>.' },
  };

  const SITUATIONS = [
    { etape: 1, titre: 'Son pur', texte: 'Tension délivrée par un microphone : son pur.', methode: 'directe',
      def: { axeX: axe(16, 2), axeY: AY, signal: { forme: 'sinus', periode: 4, ampl: 1.1, phase: 1 }, nImpose: 1 }, methodes: ['directe'] },
    { etape: 1, titre: 'Signal triangulaire', texte: 'Tension délivrée par un générateur de signaux (GBF).', methode: 'directe',
      def: { axeX: axe(20, 1), axeY: AY, signal: { forme: 'triangle', periode: 5, ampl: 1, phase: 0.75 }, nImpose: 1 }, methodes: ['directe'] },
    { etape: 2, titre: 'Son d\'un instrument', texte: 'Tension délivrée par un microphone placé devant un instrument de musique.', methode: 'directe',
      def: { axeX: axe(14, 2), axeY: AY, signal: { forme: 'clarinette', periode: 2.5, ampl: 1.2, phase: phaseSommet('clarinette', 2.5, 2) }, nImpose: 'plusieurs' }, methodes: ['directe'],
      comparer: 'Une période : entre deux graduations, difficile à lire ; 4 périodes : 4T = 10 ms, donc T = 2,5 ms. L\'erreur de lecture est partagée entre les 4 périodes : la mesure est plus précise.' },
    { etape: 2, titre: 'Électrocardiogramme', texte: 'Activité électrique du cœur au repos.', methode: 'directe',
      def: { axeX: axe(5, 0.5, 's'), axeY: { min: -0.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'mV' },
        signal: { forme: 'ecg', periode: 0.8, ampl: 1.2, phase: phaseSommet('ecg', 0.8, 0.5) }, nImpose: 'plusieurs' },
      methodes: ['directe'], battements: true },
    { etape: 3, titre: 'Son d\'une clarinette', texte: 'Tension délivrée par un microphone placé devant une clarinette.', methode: 'regle',
      def: { axeX: axe(13, 1), axeY: AY, signal: { forme: 'clarinette', periode: 2.9, ampl: 1.2, phase: 0 }, nMesure: 1 }, methodes: ['regle'] },
    { etape: 3, titre: 'Son d\'un diapason (la<sub>3</sub>)', texte: 'Tension délivrée par un microphone placé devant un diapason qui donne la note la<sub>3</sub>.', methode: 'regle',
      def: { axeX: axe(10, 1), axeY: AY, signal: { forme: 'sinus', periode: 2.27, ampl: 1.1, phase: 0.03 }, nMesure: 4 }, methodes: ['regle'] },
  ];
  function complet(def) {
    return Object.assign({ type: 'periode', grandeur: { symbole: 'T', nom: 'période', noms: 'périodes' },
      unites: ['cm', 'mm', def.axeX.unite === 's' ? 's' : 'ms', def.axeX.unite === 's' ? 'ms' : 's', def.axeY.unite] }, def);
  }

  function mesure(zone) {
    let idx = 0;
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      situation(SITUATIONS[idx], idx + 1);
    }

    function situation(sit, num) {
      const def = complet(sit.def), u = def.axeX.unite, T = def.signal.periode;
      const premiere = num === 1 || SITUATIONS[num - 2].etape !== sit.etape;
      const etapes = [`Mesure T (${sit.etape === 3 ? 'règle et tableau' : 'lecture directe'}).`];
      if (u !== 's') etapes.push('Convertis T en secondes.');
      etapes.push('Calcule f = 1 / T.<span class="pf-li-aide pf-li-rappel">f = 1 / T, avec T en secondes (s) et f en hertz (Hz).</span>');
      const carte = el('div', 'er-card');
      carte.innerHTML = `<div class="pf-sit-tete"><h3 class="pf-sit-titre">${sit.titre}</h3><span class="pf-sit-num">Situation ${num} / ${SITUATIONS.length}</span></div>
        <div class="pf-etape-cle${premiere ? '' : ' pf-etape-rappel'}"><p><b>${ETAPES[sit.etape].titre}.</b> ${ETAPES[sit.etape].texte}</p></div>
        <div class="pf-manip pf-manip-mesure">
          <div class="pf-manip-fig"><p class="pf-fig-t">${sit.texte}</p><div data-a="lg"></div></div>
          <div class="pf-manip-panneau">
            <ol class="pf-deroule">${etapes.map(e => `<li><span>${e}</span></li>`).join('')}</ol>
            <div data-a="aide" hidden><p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p><button type="button" class="btn-small">Afficher la réponse</button></div>
            <div data-a="freq"></div>
            <div data-a="bilan"></div>
            <div data-a="suite"></div>
          </div>
        </div>`;
      zone.appendChild(carte);
      const $ = a => carte.querySelector(`[data-a="${a}"]`);
      const lis = carte.querySelectorAll('.pf-deroule li');
      const deroule = n => lis.forEach((li, i) => { li.classList.toggle('fait', i < n); li.classList.toggle('ici', i === n); li.classList.toggle('avenir', i > n); });
      deroule(0);

      // 1. mesure de T : méthode imposée (l'autre est grisée) ; « Afficher la réponse » après deux erreurs
      let mesuree = false, nErr = 0;
      const lg = LG.poserQuestion($('lg'), def, {
        choixMethode: true, methode: sit.methode, methodes: sit.methodes,
        lienRegle: PF.revois(['lecture']),
        boutonSuivant: false, boutonPasser: false, sansPoints: true,
        onErreur() { if (++nErr >= 2 && !mesuree) $('aide').hidden = false; },
        onFini(tot, max, info) {
          if (mesuree) return;
          mesuree = true; $('aide').hidden = true;
          deroule(1);
          frequence(info.valeur, info);
        },
      });
      $('aide').querySelector('button').onclick = () => {
        if (mesuree) return;
        mesuree = true; $('aide').hidden = true;
        lg.detruire();
        const A = LG.analyser(def, LG.repere(def)), n = A.nMax;
        $('lg').innerHTML = `${LG.figure(def, [], false)}
          <div class="callout er-retour pf-corr"><p><b>Réponse.</b> ${n > 1 ? `On mesure ${n} périodes : ${n}T = ${PF.court(n * T)} ${u}, donc ` : ''}T = ${PF.court(T)} ${u}.</p></div>`;
        deroule(1);
        frequence(T, { methode: 'affichee' });
      };

      // 2. et 3. T en secondes, puis f = 1 / T
      function frequence(Tm, info) {
        const parties = PF.partiesFrequence({ T: +Tm.toPrecision(3), unite: u, exact: T });
        const q = { parties };
        $('freq').innerHTML = '<p class="pf-freq-t">Calcul de la fréquence</p>';
        PF.question($('freq'), q, {
          partie(i) { deroule(2 + i); },
          fin() { deroule(etapes.length); finSituation(Tm, info); },
        }, 'manip');
        // la question suivante est amenée à l'écran (sans avoir à remonter dans la page)
        PF.amener($('freq'));
      }
      function finSituation(Tm, info) {
        const f = 1 / (T * (u === 's' ? 1 : 1e-3));
        let h = '';
        if (sit.comparer) h += `<p>${sit.comparer}</p>`;
        if (sit.battements) h += `<p>f = ${fmt(f)} Hz : le cœur bat ${fmt(f)} fois par seconde, soit ${fmt(f)} × 60 = <b>${fmt(f * 60)} battements par minute</b>.</p>`;
        if (sit.etape === 3 && info.methode === 'regle') h += `<p>La règle et le tableau donnent une valeur qu'on ne pouvait pas lire directement sur l'axe.</p>`;
        if (h) $('bilan').innerHTML = `<div class="callout-accent er-retour pf-bilan">${h}</div>`;
        if (num < SITUATIONS.length) {
          $('suite').innerHTML = '<div class="er-actions pf-suite"><button type="button" class="btn-primary">Situation suivante →</button></div>';
          $('suite').querySelector('button').onclick = () => { idx++; afficher(); };
        } else {
          // fin du module : la fiche récapitulative
          SOM.marquer({ fait: true });
          $('suite').innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Module terminé.</b> Retrouve l'essentiel sur la fiche récapitulative.</p></div>
            <div class="er-actions pf-suite"><a class="btn-primary" style="text-decoration:none" href="fiche_2.html">Fiche récapitulative →</a>
            <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button></div>`;
          $('suite').querySelector('[data-a="re"]').onclick = () => { idx = 0; afficher(); };
        }
        PF.amener($('suite'));
      }
    }

    afficher();
  }

  PF.mesure = mesure;
})();
