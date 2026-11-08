/* ============================================================
   Module 1 : le motif élémentaire (manipulation guidée)
   PF.motif(zone)
   - avant de commencer (deux questions) : trois signaux, dont un non périodique ;
     l'élève touche « Périodique » ou « Non périodique » sous chacun ;
   - situations 1 à 6 : l'élève touche le début d'un motif, puis sa fin (LG.pointeur) ;
     le motif juste se surligne et la double flèche T s'affiche.
   Vérification : la fin est au point qui correspond au début une période plus loin
   (même valeur et même sens de variation), à 2 % de T ou 2 mm près.
   ============================================================ */
(function () {
  'use strict';

  const el = PF.el;
  // axes des signaux « papier »
  const axe = (max, pas, unite) => ({ min: 0, max, pas, nom: 't', unite: unite || 'ms', libelle: 't' });
  const AY = { min: -1.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'V' };
  const AY_ECG = { min: -0.5, max: 1.5, pas: 0.5, nom: 'u', unite: 'mV' };

  /* ---------- Signaux non périodiques (reproductibles) ---------- */
  function hasardFixe(g) {
    return () => { g |= 0; g = g + 0x6D2B79F5 | 0; let t = Math.imul(g ^ g >>> 15, 1 | g); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // bruit : somme de sinusoïdes de fréquences sans rapport simple, amplitude qui varie
  function bruit(graine) {
    const r = hasardFixe(graine), comp = [];
    for (let i = 0; i < 7; i++) comp.push({ a: 0.15 + 0.3 * r(), f: 0.2 + 1.9 * r() * (1 + i * 0.35), p: 6.3 * r() });
    const s = comp.reduce((x, c) => x + c.a, 0);
    return t => comp.reduce((x, c) => x + c.a * Math.sin(2 * Math.PI * c.f * t + c.p), 0) / s * 1.3 * (0.75 + 0.25 * Math.sin(0.9 * t));
  }
  // battements irréguliers : battements du cœur à des intervalles différents
  function battements(dates) {
    const g = LG.FORMES.ecg;
    return t => dates.reduce((x, d) => { const v = (t - d) / 0.8; return x + (v >= 0 && v < 1 ? g(v) : 0); }, 0);
  }

  /* ---------- Avant de commencer : périodique ou non ? ---------- */
  const TRI = [
    [
      { nom: 'Son d\'un diapason', def: { axeX: axe(10, 1), axeY: AY, signal: { forme: 'sinus', periode: 2.27, ampl: 1.1, phase: 0.3 } }, per: true },
      { nom: 'Bruit d\'une rue', def: { axeX: axe(10, 1), axeY: AY, f: bruit(11) }, per: false },
      { nom: 'Signal créneau', def: { axeX: axe(20, 2), axeY: AY, signal: { forme: 'carre', periode: 4, ampl: 1, phase: 1 } }, per: true },
    ],
    [
      { nom: 'Battements du cœur au repos', def: { axeX: axe(4, 0.5, 's'), axeY: AY_ECG, signal: { forme: 'ecg', periode: 0.8, ampl: 1.2, phase: 0.1 } }, per: true },
      { nom: 'Battements du cœur pendant un effort irrégulier', def: { axeX: axe(4, 0.5, 's'), axeY: AY_ECG, f: battements([0.05, 0.75, 1.75, 2.3, 3.25]) }, per: false },
      { nom: 'Son d\'une clarinette', def: { axeX: axe(12, 1), axeY: AY, signal: { forme: 'clarinette', periode: 2.9, ampl: 1.2, phase: 0.2 } }, per: true },
    ],
  ];

  /* ---------- Situations 1 à 6 ---------- */
  const SITUATIONS = [
    { titre: 'Son d\'un diapason', texte: 'Tension délivrée par un microphone placé devant un diapason.',
      def: { axeX: axe(10, 1), axeY: AY, signal: { forme: 'sinus', periode: 2.27, ampl: 1.1, phase: 0.3 } } },
    { titre: 'Son d\'une clarinette', texte: 'Tension délivrée par un microphone placé devant une clarinette.',
      def: { axeX: axe(12, 1), axeY: AY, signal: { forme: 'clarinette', periode: 2.9, ampl: 1.2, phase: 0.2 } } },
    { titre: 'Électrocardiogramme', texte: 'Activité électrique du cœur au repos.',
      def: { axeX: axe(4, 0.5, 's'), axeY: AY_ECG, signal: { forme: 'ecg', periode: 0.8, ampl: 1.2, phase: 0.1 } } },
    { titre: 'Signal créneau', texte: 'Tension délivrée par un générateur de signaux (GBF).',
      def: { axeX: axe(20, 2), axeY: AY, signal: { forme: 'carre', periode: 5, ampl: 1, phase: 1 } } },
    { titre: 'Signal triangulaire', texte: 'Tension délivrée par un générateur de signaux (GBF).',
      def: { axeX: axe(16, 2), axeY: AY, signal: { forme: 'triangle', periode: 4, ampl: 1, phase: 0.6 } } },
    { titre: 'Son d\'une trompette', texte: 'Tension délivrée par un microphone placé devant une trompette.',
      def: { axeX: axe(10, 1), axeY: AY, signal: { forme: 'trompette', periode: 2.5, ampl: 1.2, phase: 0.3 } } },
  ];
  // compléments communs à toutes les définitions LG
  function complet(def) { return Object.assign({ type: 'libre', grandeur: { symbole: 'T', nom: 'période', noms: 'périodes' } }, def); }

  function motif(zone) {
    let etape = 0;          // 0, 1 : avant de commencer ; 2 à 7 : situations 1 à 6 ; 8 : bilan
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      if (etape < 2) tri(TRI[etape], etape);
      else if (etape < 8) situation(SITUATIONS[etape - 2], etape - 1);
      else bilan();
    }
    function suivant(bouton, texte) {
      bouton.innerHTML = `<div class="er-actions pf-suite"><button type="button" class="btn-primary">${texte}</button></div>`;
      const b = bouton.querySelector('button');
      b.onclick = () => { etape++; afficher(); };
      PF.defiler(bouton);
    }

    /* ----- Périodique ou non ? Trois signaux ----- */
    function tri(liste, q) {
      const carte = el('div', 'er-card');
      carte.innerHTML = `<div class="pf-sit-tete"><h3 class="pf-sit-titre">Périodique ou non ?</h3><span class="pf-sit-num">Avant de commencer · question ${q + 1} / 2</span></div>
        <div class="pf-consigne"><p>Un signal est <b>périodique</b> s'il se répète à l'identique à intervalle de temps régulier. Sous chaque signal, touche <b>Périodique</b> ou <b>Non périodique</b>.</p></div>
        <div class="pf-tri"></div><div data-a="suite"></div>`;
      zone.appendChild(carte);
      const box = carte.querySelector('.pf-tri');
      let restants = liste.length;
      PF.melanger(liste).forEach(s => {
        const d = el('div', 'pf-tri-sig', `<p class="pf-tri-nom">${s.nom}</p>${LG.figure(complet(s.def), [], true)}
          <div class="ph-choix"><button type="button" class="btn-secondary" data-r="1">Périodique</button><button type="button" class="btn-secondary" data-r="0">Non périodique</button></div>
          <div class="pf-tri-ret" aria-live="polite"></div>`);
        box.appendChild(d);
        const ret = d.querySelector('.pf-tri-ret');
        d.querySelectorAll('button').forEach(b => {
          b.onclick = () => {
            if (b.disabled) return;
            const juste = (b.dataset.r === '1') === s.per;
            if (juste) {
              b.classList.add('juste');
              d.querySelectorAll('button').forEach(x => { x.disabled = true; });
              ret.innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Juste !</b> ${s.per ? 'Le même motif revient à intervalle de temps régulier.' : 'Aucune portion ne revient exactement pareille.'}</p></div>`;
              if (--restants === 0) suivant(carte.querySelector('[data-a="suite"]'), q === 0 ? 'Question suivante →' : 'Situation suivante →');
            } else {
              b.classList.add('faux'); b.disabled = true;
              ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${s.per
                ? 'Ce signal se répète à l\'identique à intervalle de temps régulier : repère le morceau qui revient.'
                : 'Ce signal ne se répète pas à l\'identique : cherche une portion qui revient exactement pareille.'}</p></div>`;
            }
          };
        });
      });
    }

    /* ----- Toucher le début puis la fin d'un motif ----- */
    function situation(sit, num) {
      const def = complet(sit.def), R = LG.repere(def), A = LG.analyser(def, R), T = def.signal.periode;
      const carte = el('div', 'er-card');
      carte.innerHTML = `<div class="pf-sit-tete"><h3 class="pf-sit-titre">${sit.titre}</h3><span class="pf-sit-num">Situation ${num} / 6</span></div>
        <div class="pf-manip">
          <div class="pf-manip-fig">
            <p class="pf-fig-t">${sit.texte}</p>
            <div class="lg-graph-box">${LG.svgGraphique(Object.assign({}, def, { type: '_' }), R, A)}</div>
            <div class="pf-cmd">
              <button type="button" class="btn-secondary pf-fl" data-a="moins" aria-label="Reculer le dernier point touché">◀</button>
              <button type="button" class="btn-secondary pf-fl" data-a="plus" aria-label="Avancer le dernier point touché">▶</button>
              <button type="button" class="btn-small" data-a="effacer">Effacer les points</button>
            </div>
          </div>
          <div class="pf-manip-panneau">
            <ol class="pf-deroule">
              <li data-e="0"><span>Touche le <b>début</b> d'un motif : n'importe quel point du signal.</span></li>
              <li data-e="1"><span>Touche la <b>fin</b> de ce motif : le point qui correspond au début, un motif plus loin.</span></li>
              <li data-e="2"><span>Vérifie ton motif.</span></li>
            </ol>
            <p class="pf-aide-t">◀ ▶ déplacent le dernier point touché ; un nouvel appui remplace le point le plus proche.</p>
            <div class="er-actions"><button type="button" class="btn-primary" data-a="verif" disabled>Vérifier le motif</button></div>
            <div data-a="retour" aria-live="polite"></div>
            <div data-a="aide" hidden><button type="button" class="btn-small">Afficher la réponse</button></div>
            <div data-a="suite"></div>
          </div>
        </div>`;
      zone.appendChild(carte);
      const $ = a => carte.querySelector(`[data-a="${a}"]`);
      const lis = carte.querySelectorAll('.pf-deroule li');
      let fini = false, erreurs = 0;
      function deroule(n) { lis.forEach((li, i) => { li.classList.toggle('fait', i < n); li.classList.toggle('ici', i === n); li.classList.toggle('avenir', i > n); }); }
      const ptr = LG.pointeur(carte.querySelector('.lg-svg'), def, R, A, {
        onChange(p) { if (fini) return; deroule(Math.min(2, p.length)); $('verif').disabled = p.length < 2; $('retour').innerHTML = ''; },
      });
      deroule(0);
      $('moins').onclick = () => ptr.deplacer(-1);
      $('plus').onclick = () => ptr.deplacer(1);
      $('effacer').onclick = () => ptr.effacer();

      function reussir(t1, vue) {
        fini = true;
        ptr.poser([t1, t1 + T]);
        ptr.surligner(t1, t1 + T, 'T');
        ptr.verrouiller();
        deroule(3);
        $('verif').disabled = true; $('aide').hidden = true;
        $('retour').innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour"><p><b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : erreurs ? 'C\'est juste.' : 'Juste !'}</b> Ce morceau est le <b>motif élémentaire</b> : il se répète à l'identique juste après. Sa durée est la <b>période T</b>.</p></div>`;
        suivant($('suite'), num < 6 ? 'Situation suivante →' : 'Voir le bilan →');
      }
      $('verif').onclick = () => {
        if (fini) return;
        const p = ptr.points();
        if (p.length < 2) return;
        const [t1, t2] = p, d = t2 - t1, k = Math.round(d / T), tol = Math.max(0.02 * T, 2 / R.mmX);
        const etendue = 2 * (def.signal.ampl || 1);
        const memeValeur = Math.abs(A.f(t2) - A.f(t1)) <= 0.06 * etendue;
        let diag;
        if (k >= 1 && Math.abs(d - k * T) <= tol) {
          if (k === 1) { reussir(t1); return; }
          diag = k === 2 ? 'Tu as pris deux motifs : le motif élémentaire est le plus petit morceau qui se répète.'
            : `Tu as pris ${k} motifs : le motif élémentaire est le plus petit morceau qui se répète.`;
        } else if (d < tol) diag = 'Le début et la fin sont presque au même endroit : la fin du motif est plus loin.';
        else if (Math.abs(d - T / 2) <= tol || (memeValeur && d < T)) diag = 'Le signal repasse par la même valeur, mais il ne repart pas de la même façon : ce n\'est qu\'une partie du motif.';
        else if (memeValeur) diag = 'Le signal repasse par la même valeur, mais il ne repart pas de la même façon : ce point ne correspond pas au début.';
        else diag = 'Le morceau choisi ne se répète pas à l\'identique juste après.';
        erreurs++;
        ptr.marquer(1, 'ko');
        $('retour').innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p>${erreurs >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p>' : ''}</div>`;
        if (erreurs >= 2) $('aide').hidden = false;
      };
      $('aide').querySelector('button').onclick = () => {
        if (fini) return;
        const p = ptr.points();
        // motif à partir du début touché (s'il laisse la place), sinon du premier sommet
        let t1 = p.length ? p[0] : def.axeX.min + 0.3 * T;
        if (t1 + T > def.axeX.max) t1 = def.axeX.min + 0.3 * T;
        reussir(t1, true);
      };
    }

    /* ----- Bilan ----- */
    function bilan() {
      SOM.marquer({ fait: true });
      const carte = el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">BILAN</span>
        <div class="cle"><p><b class="cle-titre">À retenir.</b> Un signal <b>périodique</b> se répète à l'identique à intervalle de temps régulier. La <b>période T</b> est la durée du motif élémentaire. On peut la mesurer entre deux sommets, deux creux, ou deux points qui se correspondent.</p></div>
        <div class="er-actions">
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_2_manip.html">Module 2 : mesurer T et calculer f →</a>
        </div>`;
      zone.appendChild(carte);
      carte.querySelector('[data-a="re"]').onclick = () => { etape = 0; afficher(); };
    }
    afficher();
  }

  PF.motif = motif;
})();
