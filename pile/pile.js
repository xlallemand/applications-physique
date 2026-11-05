/* ============================================================
   Moteur « Schéma d'une pile » (pile électrochimique)
   Source unique, chargée par :
     - pile/index.html (application « Schéma d'une pile », Tle spécialité et STI2D) ;
     - oxydoreduction-STI2D/modules/module_5_pile.html (Chapitre 15, module 5) ;
     - oxydoreduction-STI2D/modules/module_6.html (exercices 8 et 9, en partie d'exercice).
   Styles : pile/pile.css. Glisser-déposer : assets/dragdrop.js (à charger avant).
   Schéma : même dessin que la figure du cours (OX.figPile), à la largeur disponible
   (300 à 640 px). Une étiquette se glisse sur sa case, ou se touche puis on touche la case.

   API (objet PILE) :
     PILE.monter(zone, opts) → { recommencer(), montrer() }
       Construit l'outil dans la zone (plusieurs exemplaires possibles dans une page :
       identifiants préfixés, aucun état global).
       opts.entete        { badge, titre } : carte d'en-tête dessinée dans la zone
                          (« Question n/10 · Score », barre de progression) ; sans entete,
                          la page affiche la progression avec opts.surProgression
       opts.surProgression(info)  info = { question, total, score } à chaque changement
       opts.fin(note)     fin de la série : note sur 20
       opts.finActions    HTML ajouté sous l'écran de fin (liens « Revoir le cours »…)
       opts.questions     liste fixe de questions (sinon 10 questions tirées au hasard) :
                          [{ anode: 'Zn', cathode: 'Cu', anodeSide: 'L' | 'R',
                             hint: 'meter' | 'electrons' | 'current' | 'polarity' | 'half_eqs_placed' | 'consomme',
                             gML, gIL, gMR, gIR (métal / ion donnés à gauche / à droite), appareil: 'V' | 'A' }]
       opts.partie        { reussi(), erreur(html), compterErreur() } : mode « partie d'exercice »
                          (une seule question, ni « Afficher la réponse » ni « Question suivante » :
                          le moteur de l'exercice les gère ; montrer() affiche la réponse)

   Barème d'une question : 2 points si tout est juste à la première vérification,
   1 point après une erreur (vérification fausse), 0 point si la réponse est affichée.
   ============================================================ */
(function () {
  'use strict';

  // =============================================
  // COUPLES REDOX (nom et « de … » : énoncés des exercices)
  // =============================================
  const COUPLES = [
    { id:'Zn',  metal:'Zn',  ion:'Zn²⁺',  ionH:'Zn<sup>2+</sup>',  n:2, E0:-0.76, label:'Zn²⁺/Zn', nom:'zinc', de:'de zinc',
      eqOxH:'Zn → Zn<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Zn<sup>2+</sup> + 2e<sup>−</sup> → Zn',
      eqStdH:'Zn<sup>2+</sup> + 2e<sup>−</sup> = Zn' },
    { id:'Cu',  metal:'Cu',  ion:'Cu²⁺',  ionH:'Cu<sup>2+</sup>',  n:2, E0:+0.34, label:'Cu²⁺/Cu', nom:'cuivre', de:'de cuivre',
      eqOxH:'Cu → Cu<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Cu<sup>2+</sup> + 2e<sup>−</sup> → Cu',
      eqStdH:'Cu<sup>2+</sup> + 2e<sup>−</sup> = Cu' },
    { id:'Fe',  metal:'Fe',  ion:'Fe²⁺',  ionH:'Fe<sup>2+</sup>',  n:2, E0:-0.44, label:'Fe²⁺/Fe', nom:'fer', de:'de fer',
      eqOxH:'Fe → Fe<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Fe<sup>2+</sup> + 2e<sup>−</sup> → Fe',
      eqStdH:'Fe<sup>2+</sup> + 2e<sup>−</sup> = Fe' },
    { id:'Ag',  metal:'Ag',  ion:'Ag⁺',   ionH:'Ag<sup>+</sup>',   n:1, E0:+0.80, label:'Ag⁺/Ag', nom:'argent', de:'d\'argent',
      eqOxH:'Ag → Ag<sup>+</sup> + e<sup>−</sup>', eqRedH:'Ag<sup>+</sup> + e<sup>−</sup> → Ag',
      eqStdH:'Ag<sup>+</sup> + e<sup>−</sup> = Ag' },
    { id:'Pb',  metal:'Pb',  ion:'Pb²⁺',  ionH:'Pb<sup>2+</sup>',  n:2, E0:-0.13, label:'Pb²⁺/Pb', nom:'plomb', de:'de plomb',
      eqOxH:'Pb → Pb<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Pb<sup>2+</sup> + 2e<sup>−</sup> → Pb',
      eqStdH:'Pb<sup>2+</sup> + 2e<sup>−</sup> = Pb' },
    { id:'Ni',  metal:'Ni',  ion:'Ni²⁺',  ionH:'Ni<sup>2+</sup>',  n:2, E0:-0.23, label:'Ni²⁺/Ni', nom:'nickel', de:'de nickel',
      eqOxH:'Ni → Ni<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Ni<sup>2+</sup> + 2e<sup>−</sup> → Ni',
      eqStdH:'Ni<sup>2+</sup> + 2e<sup>−</sup> = Ni' },
    { id:'Sn',  metal:'Sn',  ion:'Sn²⁺',  ionH:'Sn<sup>2+</sup>',  n:2, E0:-0.14, label:'Sn²⁺/Sn', nom:'étain', de:'d\'étain',
      eqOxH:'Sn → Sn<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Sn<sup>2+</sup> + 2e<sup>−</sup> → Sn',
      eqStdH:'Sn<sup>2+</sup> + 2e<sup>−</sup> = Sn' },
    { id:'Al',  metal:'Al',  ion:'Al³⁺',  ionH:'Al<sup>3+</sup>',  n:3, E0:-1.66, label:'Al³⁺/Al', nom:'aluminium', de:'d\'aluminium',
      eqOxH:'Al → Al<sup>3+</sup> + 3e<sup>−</sup>', eqRedH:'Al<sup>3+</sup> + 3e<sup>−</sup> → Al',
      eqStdH:'Al<sup>3+</sup> + 3e<sup>−</sup> = Al' },
    { id:'Mg',  metal:'Mg',  ion:'Mg²⁺',  ionH:'Mg<sup>2+</sup>',  n:2, E0:-2.37, label:'Mg²⁺/Mg', nom:'magnésium', de:'de magnésium',
      eqOxH:'Mg → Mg<sup>2+</sup> + 2e<sup>−</sup>', eqRedH:'Mg<sup>2+</sup> + 2e<sup>−</sup> → Mg',
      eqStdH:'Mg<sup>2+</sup> + 2e<sup>−</sup> = Mg' },
    { id:'Cr',  metal:'Cr',  ion:'Cr³⁺',  ionH:'Cr<sup>3+</sup>',  n:3, E0:-0.74, label:'Cr³⁺/Cr', nom:'chrome', de:'de chrome',
      eqOxH:'Cr → Cr<sup>3+</sup> + 3e<sup>−</sup>', eqRedH:'Cr<sup>3+</sup> + 3e<sup>−</sup> → Cr',
      eqStdH:'Cr<sup>3+</sup> + 3e<sup>−</sup> = Cr' },
  ];
  const coupleDe = id => COUPLES.find(c => c.id === id);

  // =============================================
  // HELPERS
  // =============================================
  function shuffle(a) {
    const b = [...a];
    for (let i = b.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [b[i],b[j]] = [b[j],b[i]];
    }
    return b;
  }
  function lcm(a,b){ return a*b/gcd(a,b); }
  function gcd(a,b){ return b===0?a:gcd(b,a%b); }

  // =============================================
  // GENERATE QUESTIONS (10 questions tirées au hasard)
  // =============================================
  function genQuestions() {
    const HINT_TYPES = shuffle([
      'meter','electrons','current','polarity','half_eqs_placed',
      'meter','electrons','current','polarity','half_eqs_placed'
    ]);
    const ANODE_SIDES = shuffle(['L','L','L','L','L','R','R','R','R','R']);

    const questions = [];
    const pool = shuffle(COUPLES);
    const n = pool.length;

    for (let i = 0; i < 10; i++) {
      const a = pool[i % n];
      let bIdx = (i + 2 + Math.floor(Math.random()*(n-3))) % n;
      if (pool[bIdx].id === a.id) bIdx = (bIdx+1) % n;
      const b = pool[bIdx];

      let anodeCouple, cathodeCouple;
      if (a.E0 < b.E0) { anodeCouple = a; cathodeCouple = b; }
      else { anodeCouple = b; cathodeCouple = a; }

      const hint = HINT_TYPES[i];
      const anodeSide = ANODE_SIDES[i];

      const leftCouple  = anodeSide === 'L' ? anodeCouple  : cathodeCouple;
      const rightCouple = anodeSide === 'L' ? cathodeCouple : anodeCouple;

      const leftGiveMetal = Math.random() < 0.5;
      const gML = leftGiveMetal;
      const gIL = !leftGiveMetal;
      const rightGiveMetal = Math.random() < 0.5;
      const gMR = rightGiveMetal;
      const gIR = !rightGiveMetal;

      questions.push({
        anode: anodeCouple,
        cathode: cathodeCouple,
        leftCouple,
        rightCouple,
        anodeSide,
        hint,
        gML, gIL, gMR, gIR
      });
    }
    return questions;
  }

  // question fixe (exercices) : couples donnés par leur symbole
  function questionFixe(d) {
    const anode = coupleDe(d.anode), cathode = coupleDe(d.cathode);
    const anodeSide = d.anodeSide || 'L';
    return {
      anode, cathode, anodeSide, hint: d.hint || 'meter', appareil: d.appareil,
      leftCouple:  anodeSide === 'L' ? anode : cathode,
      rightCouple: anodeSide === 'L' ? cathode : anode,
      gML: !!d.gML, gIL: !!d.gIL, gMR: !!d.gMR, gIR: !!d.gIR,
    };
  }

  // Confettis (sans-faute), comme dans les séries de questions
  function confettis() {
    const col = ['#0a7d57', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const e = document.createElement('div');
      e.className = 'er-confetti';
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.background = col[i % col.length];
      e.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      e.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 4800);
    }
  }

  let nInstances = 0;

  /* ============================================================
     UN EXEMPLAIRE DE L'OUTIL, monté dans la zone donnée
     ============================================================ */
  function monter(root, opts) {
    opts = opts || {};
    const P = 'pile' + (++nInstances) + '-';                  // préfixe des identifiants de cet exemplaire
    const $ = id => document.getElementById(P + id);
    const enPartie = !!opts.partie;

    // =============================================
    // STATE
    // =============================================
    let questions = [];
    let qIdx = 0;
    let totalScore = 0;
    let Q = {};
    let F = {};
    let hasError = false;
    let locked = false;
    let dragging = null;
    let recap = [];                                            // points de chaque question (écran de fin)
    const NB = () => questions.length;

    // =============================================
    // ÉCRANS (question, fin)
    // =============================================
    const titreBloc = (n, t) => `<h3 class="pile-bloc-t"><span class="pile-num">${n}</span>${t}</h3>`;
    const sousTitre = t => `<div class="pile-banque-t">${t}</div>`;
    root.classList.add('pile-app');
    root.innerHTML = `
    ${opts.entete && !enPartie ? `<div class="er-card"><span class="er-badge">${opts.entete.badge}</span><h2 class="er-titre">${opts.entete.titre}</h2>
      <p class="er-meta">Question <span id="${P}num">1</span>/<span id="${P}nb">10</span> · Score : <b id="${P}score">0 pt</b></p>
      <div class="progress-bar"><div class="progress-fill" id="${P}prog" style="width:0%"></div></div></div>` : ''}

    <!-- QUESTION SCREEN -->
    <div id="${P}q-screen">

      <!-- CONSIGNES -->
      <div class="cle pile-consignes">
        <div class="pile-consignes-t">Consignes</div>
        <ul>
          <li><span class="pile-num">1</span>
            <span><strong>Schéma de la pile :</strong> place les entités chimiques (métaux, ions, polarités, sens des électrons et du courant, ions du pont salin…) aux bons emplacements sur le schéma.</span></li>
          <li><span class="pile-num">2</span>
            <span><strong>Demi-piles :</strong> dépose la demi-équation dans chaque demi-pile, puis utilise le bouton <span class="pile-ex-flip">⇌</span> pour l'orienter dans le <strong class="pile-acc">bon sens de fonctionnement</strong>. Indique aussi le type de réaction et le nom de l'électrode.</span></li>
          <li><span class="pile-num">3</span>
            <span><strong>Équation de fonctionnement :</strong> construis l'équation de la pile en glissant les espèces chimiques dans les zones Réactifs et Produits. Vérifie qu'elle est bien <strong class="pile-acc">équilibrée</strong> (ajuste les nombres stœchiométriques avec les flèches ▲ et ▼).</span></li>
          <li><span class="pile-num">4</span>
            <span><strong>Vérification :</strong> tu peux vérifier, corriger tes réponses et vérifier encore autant de fois que tu veux. ${enPartie ? 'Tout juste à la première vérification : 2 points ; sinon : 1 point ; correction affichée : 0 point.' : 'Si tout est juste dès la première vérification, tu gagnes 2 points. Sinon, tu gagnes 1 point. Si tu affiches la réponse, tu ne gagnes pas de point.'}</span></li>
        </ul>
        <p class="pile-astuce">Glisse chaque étiquette à sa place, ou touche-la puis touche sa place. Touche une case remplie pour la vider.</p>
      </div>

      <!-- DATA -->
      <div class="pile-donnees">
        <div class="pile-donnees-t">Données</div>
        <div id="${P}data-wrap" class="pile-donnees-c"></div>
      </div>

      <!-- 1. SCHÉMA : étiquettes, schéma, vérification du schéma -->
      <div class="pile-bloc">
        ${titreBloc(1, 'Schéma de la pile')}
        <div class="pile-banque">
          ${sousTitre('Étiquettes à placer sur le schéma')}
          <div id="${P}bank-schema" class="pile-banque-l"></div>
        </div>
        <div id="${P}schema-wrap" class="pile-defile"></div>
        <div class="pile-actions">
          <button type="button" class="btn-secondary" data-act="checkSchema">Vérifier le schéma</button>
        </div>
        <div id="${P}hints-schema" class="pile-retour"></div>
      </div>

      <!-- 2. DEMI-PILES : étiquettes, deux colonnes, vérification des demi-piles -->
      <div class="pile-bloc">
        ${titreBloc(2, 'Demi-piles')}
        <div class="pile-banque">
          ${sousTitre('Étiquettes à placer sous les demi-piles')}
          <div id="${P}bank-lower" class="pile-banque-l"></div>
        </div>
        <div id="${P}lower-wrap"></div>
        <div class="pile-actions">
          <button type="button" class="btn-secondary" data-act="checkDemiPiles">Vérifier les demi-piles</button>
        </div>
        <div id="${P}hints-demipiles" class="pile-retour"></div>
      </div>

      <!-- 3. ÉQUATION DE FONCTIONNEMENT (espèces à placer dans le bloc) -->
      <div class="pile-bloc">
        ${titreBloc(3, 'Équation de fonctionnement de la pile')}
        <div id="${P}eq-wrap"></div>
      </div>

      <!-- HINTS -->
      <div id="${P}hints-wrap" class="pile-retour"></div>

      <!-- BUTTONS -->
      <div class="pile-actions">
        <button type="button" class="btn-primary" data-act="checkAnswer">Vérifier</button>
        ${enPartie ? '' : `<button type="button" class="btn-small" data-act="showAnswer">Afficher la réponse (sans gagner de point)</button>
        <button type="button" class="btn-primary" data-act="nextQ" id="${P}btn-next" style="display:none;">Question suivante →</button>`}
      </div>
    </div>

    <!-- END SCREEN -->
    <div id="${P}end-screen" class="er-card er-fin" style="display:none;"></div>`;

    // Boutons de l'outil : un seul écouteur (délégation), aucun gestionnaire global
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || !root.contains(b)) return;
      const d = b.dataset;
      switch (d.act) {
        case 'checkSchema': checkSchema(); break;
        case 'checkDemiPiles': checkDemiPiles(); break;
        case 'checkAnswer': checkAnswer(); break;
        case 'showAnswer': showAnswer(); break;
        case 'nextQ': nextQ(); break;
        case 'restart': restart(); break;
        case 'flipHEQ': flipHEQ(d.side, d.couple); break;
        case 'rmHEQ': rmHEQ(d.side); break;
        case 'chgCoeff': chgCoeff(d.side, +d.i, +d.delta); break;
        case 'rmFromEq': rmFromEq(d.side, +d.i); break;
      }
    });

    // le schéma suit la largeur disponible (rotation du téléphone, fenêtre redimensionnée)
    if (window.ResizeObserver) new ResizeObserver(() => placer()).observe($('schema-wrap'));

    // progression : en-tête de l'outil et/ou page qui l'accueille
    function progression() {
      const info = { question: qIdx + 1, total: NB(), score: totalScore };
      if ($('num')) {
        $('num').textContent = Math.min(qIdx + 1, NB());
        $('nb').textContent = NB();
        $('score').textContent = `${totalScore} pt${totalScore > 1 ? 's' : ''}`;
        $('prog').style.width = `${Math.round(qIdx / NB() * 100)}%`;
      }
      if (opts.surProgression) opts.surProgression(info);
    }

    // =============================================
    // DRAG ENGINE (Pointer Events communes à toutes les applications —
    // voir assets/dragdrop.js — plutôt que l'API HTML5 Drag and Drop
    // native, non prise en charge au toucher sur iOS Safari et peu
    // fiable sur Firefox Android)
    // =============================================
    const dropzoneRegistry = new Map(); // élément de zone -> { accept, onDrop }

    function makeDraggable(el, data) {
      let x0 = 0, y0 = 0;                                     // point d'appui : distingue un toucher d'un glisser
      el.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; });
      window.DragDrop.enable(el, {
        zoneSelector: '.dz:not(.given), .heq-dz:not(.given), .eq-side',
        dragOverClass: 'over',
        onStart: () => { dragging = data; },
        onDrop: (item, zone, e) => {
          if (zone && !locked) {
            const handler = dropzoneRegistry.get(zone);
            if (handler && dragging && handler.accept(dragging)) {
              handler.onDrop(dragging);
            }
            deselectionner();
          } else if (!zone && !locked && e && Math.hypot(e.clientX - x0, e.clientY - y0) < 10) {
            // simple toucher (ou clic) : l'étiquette est choisie, on touche ensuite sa case
            if (choisie && choisie.el === el) deselectionner(); else choisir(el, data);
          }
          dragging = null;
        },
      });
    }

    // =============================================
    // POSER SANS GLISSER : toucher une étiquette, puis la case
    // (les cases qui l'acceptent sont mises en valeur)
    // =============================================
    let choisie = null;                                       // { el, data } : étiquette choisie
    function choisir(el, data) {
      deselectionner();
      choisie = { el, data };
      el.classList.add('pile-choisie');
      el.setAttribute('aria-pressed', 'true');
      dropzoneRegistry.forEach((h, z) => { if (h.accept(data)) z.classList.add('pile-cible'); });
    }
    function deselectionner() {
      if (choisie) { choisie.el.classList.remove('pile-choisie'); choisie.el.setAttribute('aria-pressed', 'false'); }
      choisie = null;
      root.querySelectorAll('.pile-cible').forEach(z => z.classList.remove('pile-cible'));
    }
    // toucher une case quand une étiquette est choisie : elle y est posée
    // (phase de capture : passe avant le « toucher pour vider » de la case)
    root.addEventListener('click', e => {
      if (!choisie || e.target.closest('.drag-item')) return;
      if (e.target.closest('button')) { deselectionner(); return; }    // ⇌, ✕, ▲ ▼ : bouton normal
      const z = e.target.closest('.dz, .heq-dz, .eq-side');
      const h = z && dropzoneRegistry.get(z);
      if (h && !locked && h.accept(choisie.data)) {
        e.stopPropagation();
        h.onDrop(choisie.data);
      }
      deselectionner();
    }, true);

    function makeDropzone(el, accept, onDrop) {
      dropzoneRegistry.set(el, { accept, onDrop });
    }

    function clearDZ(el, stateKey) {
      if (locked) return;
      if (el.dataset.given === '1') return;
      if (!el.dataset.filled) return;
      const did = el.dataset.dragId;
      el.innerHTML = '';
      el.className = el.className.replace(/\b(filled|correct|incorrect)\b/g,'');
      delete el.dataset.filled;
      delete el.dataset.dragId;
      if (F[stateKey] !== undefined) F[stateKey] = null;
      if (did) {
        const bankEl = root.querySelector(`.drag-item[data-id="${did}"]`);
        if (bankEl) bankEl.classList.remove('used');
      }
    }

    function markUsed(id) {
      const bankEl = root.querySelector(`.drag-item[data-id="${id}"]`);
      if (bankEl) bankEl.classList.add('used');
    }
    function unmarkUsed(id) {
      const bankEl = root.querySelector(`.drag-item[data-id="${id}"]`);
      if (bankEl) bankEl.classList.remove('used');
    }

    // Masque l'item de la banque équation (espèce glissée dans l'équation)
    function hideSpItem(id) {
      const el = root.querySelector(`.drag-item[data-id="${id}"][data-type="sp"]`);
      if (el) el.classList.add('hidden-sp');
    }
    // Réaffiche l'item de la banque équation
    function showSpItem(id) {
      const el = root.querySelector(`.drag-item[data-id="${id}"][data-type="sp"]`);
      if (el) el.classList.remove('hidden-sp');
    }

    // =============================================
    // RENDER QUESTION
    // =============================================
    function renderQ() {
      Q = questions[qIdx];
      window.PILE.questionEnCours = Q;          // question en cours (utile pour vérifier l'application)
      F = {};
      hasError = false;
      locked = false;
      dragging = null;
      choisie = null;
      dropzoneRegistry.clear();

      progression();
      $('hints-wrap').innerHTML = '';
      $('hints-schema').innerHTML = '';
      $('hints-demipiles').innerHTML = '';
      if ($('btn-next')) $('btn-next').style.display = 'none';

      renderData();
      renderBankSchema();
      renderSchema();
      renderBankLower();
      renderLower();
      renderEq();
    }

    // =============================================
    // SCHÉMA DE LA PILE : dessin SVG + cases de dépôt posées dessus
    // Même dessin que la figure du cours (oxydoreduction-STI2D, OX.figPile) :
    // béchers ouverts, solutions teintées, pont salin en tube, électrodes,
    // appareil de mesure sur le fil du haut. Couleurs : variables du thème (pile.css).
    // La largeur suit la place disponible (300 à 640 px) : sur téléphone, le
    // schéma tient dans l'écran et les cases gardent leur taille.
    // =============================================
    const SCH = {
      H: 336,          // hauteur du schéma
      yF: 46,          // fil du haut (circuit extérieur)
      yE: 104, yE2: 250,   // haut et bas des électrodes
      yB: 166, yB2: 306,   // haut et fond des béchers
      ySol: 200,           // surface des solutions
      yT: 145, yT2: 244,   // axe du haut du pont salin, bas de ses branches
      yI: 128,             // flèches des ions du pont salin
      yN: 328,             // noms des demi-piles
    };
    // classe de chaque case du schéma (forme et taille du texte)
    const CASES = {
      'dz-electrons': 'pile-z-fl', 'dz-current': 'pile-z-fl',
      'dz-com-left': 'pile-z-com', 'dz-com-right': 'pile-z-com',
      'dz-pol-l': 'pile-z-pol', 'dz-pol-r': 'pile-z-pol',
      'dz-metal-l': 'pile-z-esp', 'dz-metal-r': 'pile-z-esp',
      'dz-ion-l': 'pile-z-esp', 'dz-ion-r': 'pile-z-esp',
      'dz-pont-left': 'pile-z-pont', 'dz-pont-right': 'pile-z-pont',
    };
    let largeurSchema = 0;

    // géométrie pour une largeur W : interpolée entre le schéma compact (300 px) et le schéma du cours (640 px)
    function geometrie(W) {
      const t = Math.max(0, Math.min(1, (W - 300) / 340));
      const marge = 6 + 64 * t, bw = 120 + 40 * t;   // marge extérieure, largeur d'un bécher
      const xg = marge + bw / 2, xd = W - xg;         // électrodes gauche et droite
      return {
        W, t, bw, xg, xd, cx: W / 2,
        R: 20 + 4 * t,                 // rayon de l'appareil de mesure
        zp: 66 + 18 * t,               // largeur des cases du pont salin
        tube: marge + bw - 14 - 4 * t, // branche gauche du pont salin (dans le bécher gauche, près de la paroi)
        Lion: 46 + 14 * t,             // longueur des flèches des ions
      };
    }

    // dessin SVG
    function dessin(g) {
      const { W, bw, xg, xd, cx, R, tube, Lion } = g, H = SCH.H;
      const r = v => Math.round(v * 10) / 10;
      const fleche = (x1, y1, x2, y2, cl, m) => `<line class="${cl}" x1="${r(x1)}" y1="${y1}" x2="${r(x2)}" y2="${y2}" marker-end="url(#${P}${m})"/>`;
      const app = Q.appareil === 'A' ? 'ampèremètre' : 'voltmètre';
      let s = `<defs>
        <marker id="${P}m-fl" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path class="ps-tete" d="M0 0 L11 5 L0 10 z"/></marker>
        <marker id="${P}m-ion" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path class="ps-tete-ion" d="M0 0 L11 5 L0 10 z"/></marker></defs>`;
      // solutions et béchers (ouverts en haut)
      [xg, xd].forEach(x => {
        const x0 = r(x - bw / 2);
        s += `<rect class="ps-sol" x="${x0}" y="${SCH.ySol}" width="${r(bw)}" height="${SCH.yB2 - SCH.ySol}"/>`;
        s += `<path class="ps-bk" d="M${x0} ${SCH.yB} V${SCH.yB2} H${r(x0 + bw)} V${SCH.yB}"/>`;
      });
      // pont salin : tube en U renversé plongé dans les deux solutions
      const a = r(tube), b = r(W - tube);
      s += `<path class="ps-tube" d="M${a} ${SCH.yT2} V${SCH.yT} H${b} V${SCH.yT2}"/>`;
      s += `<path class="ps-tube-b" d="M${a - 7} ${SCH.yT2} V${SCH.yT - 7} H${b + 7} V${SCH.yT2} M${a + 7} ${SCH.yT2} V${SCH.yT + 7} H${b - 7} V${SCH.yT2}"/>`;
      // nom du pont salin sous le tube, sur deux lignes si le tube est étroit (téléphone)
      s += b - a - 14 >= 84 ? `<text class="ps-t2" x="${r(cx)}" y="${SCH.yT + 28}">pont salin</text>`
        : `<text class="ps-t2" x="${r(cx)}" y="${SCH.yT + 26}">pont<tspan x="${r(cx)}" dy="14">salin</tspan></text>`;
      // électrodes
      [xg, xd].forEach(x => { s += `<rect class="ps-elec" x="${r(x - 9)}" y="${SCH.yE}" width="18" height="${SCH.yE2 - SCH.yE}" rx="2"/>`; });
      // circuit extérieur et appareil de mesure
      s += `<path class="ps-fil" d="M${r(xg)} ${SCH.yE} V${SCH.yF} H${r(cx - R)} M${r(cx + R)} ${SCH.yF} H${r(xd)} V${SCH.yE}"/>`;
      s += `<circle class="ps-app" cx="${r(cx)}" cy="${SCH.yF}" r="${r(R)}"/><text class="ps-app-t" x="${r(cx)}" y="${SCH.yF + 7}">${Q.appareil || 'V'}</text>`;
      // flèches à nommer sur les fils (e⁻ ou I), toutes deux tournées vers l'appareil
      const mg = (xg + cx - R) / 2, md = (cx + R + xd) / 2;
      s += fleche(mg - 14, SCH.yF, mg + 14, SCH.yF, 'ps-fl', 'm-fl') + fleche(md + 14, SCH.yF, md - 14, SCH.yF, 'ps-fl', 'm-fl');
      // flèches des ions dans le pont salin (vers chaque bécher)
      s += fleche(cx - 8, SCH.yI, cx - 8 - Lion, SCH.yI, 'ps-fl-ion', 'm-ion') + fleche(cx + 8, SCH.yI, cx + 8 + Lion, SCH.yI, 'ps-fl-ion', 'm-ion');
      // noms des demi-piles
      s += `<text class="ps-t2" x="${r(xg)}" y="${SCH.yN}">Demi-pile gauche</text><text class="ps-t2" x="${r(xd)}" y="${SCH.yN}">Demi-pile droite</text>`;
      return `<svg class="pile-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schéma d'une pile : deux demi-piles, gauche et droite, reliées par un pont salin et par un circuit extérieur avec un ${app} ; les cases à compléter sont posées sur le schéma.">${s}</svg>`;
    }

    // position de chaque case du schéma : [gauche, haut, largeur, hauteur] en px
    function positions(g) {
      const { W, xg, xd, cx, R, zp } = g, anG = Q.anodeSide === 'L';
      const mg = (xg + cx - R) / 2, md = (cx + R + xd) / 2;
      return {
        // e⁻ du côté de l'anode, I du côté de la cathode (au-dessus des flèches des fils)
        'dz-electrons': [(anG ? mg : md) - 26, 6, 52, 30],
        'dz-current':   [(anG ? md : mg) - 26, 6, 52, 30],
        // bornes de l'appareil, sous le fil
        'dz-com-left':  [cx - R - 56, 54, 50, 26],
        'dz-com-right': [cx + R + 6, 54, 50, 26],
        // polarités, à côté du haut des électrodes
        'dz-pol-l': [xg - 50, 70, 34, 34],
        'dz-pol-r': [xd + 16, 70, 34, 34],
        // métaux (à côté des électrodes) et ions (dans les solutions)
        'dz-metal-l': [Math.max(2, xg - 64), 116, 52, 30],
        'dz-metal-r': [Math.min(W - 54, xd + 12), 116, 52, 30],
        'dz-ion-l': [xg - 30, 262, 60, 30],
        'dz-ion-r': [xd - 30, 262, 60, 30],
        // ions du pont salin, au-dessus des flèches
        'dz-pont-left':  [cx - 3 - zp, 90, zp, 28],
        'dz-pont-right': [cx + 3, 90, zp, 28],
      };
    }

    function renderSchema() {
      const wrap = $('schema-wrap');
      wrap.innerHTML = `<div class="pile-schema" id="${P}schema-box"></div>`;
      const box = $('schema-box');
      Object.keys(CASES).forEach(id => {
        const d = document.createElement('div');
        d.id = P + id;
        d.className = 'dz ' + CASES[id];
        box.appendChild(d);
      });
      largeurSchema = 0;
      placer();
      setupSchemaZones();
      applyGiven();
    }

    // (re)dessine le schéma à la largeur disponible et place les cases (leur contenu est conservé)
    function placer() {
      const wrap = $('schema-wrap'), box = $('schema-box');
      if (!box || !Q.anode) return;
      const W = Math.max(300, Math.min(640, Math.floor(wrap.clientWidth || 640)));
      if (W === largeurSchema) return;
      largeurSchema = W;
      const g = geometrie(W);
      box.style.width = W + 'px';
      box.style.height = SCH.H + 'px';
      const tmp = document.createElement('div');
      tmp.innerHTML = dessin(g);
      const ancien = box.querySelector('svg');
      if (ancien) ancien.replaceWith(tmp.firstElementChild); else box.prepend(tmp.firstElementChild);
      const pos = positions(g);
      Object.keys(pos).forEach(id => {
        const el = $(id);
        if (!el) return;
        const [l, t, w, h] = pos[id];
        el.style.left = Math.round(l) + 'px'; el.style.top = t + 'px';
        el.style.width = Math.round(w) + 'px'; el.style.height = h + 'px';
      });
    }

    // =============================================
    // SETUP SCHEMA ZONES
    // =============================================
    function setupSchemaZones() {
      const { hint, gML, gIL, gMR, gIR, leftCouple, rightCouple } = Q;

      function dz(id) { return $(id); }

      function simpleZone(id, stateKey, acceptIds, makeContent, needsFill) {
        const el = dz(id);
        if (!el) return;
        if (!needsFill) { el.dataset.given = '1'; return; }

        makeDropzone(el, d => acceptIds.includes(d.id), d => {
          if (el.dataset.dragId) unmarkUsed(el.dataset.dragId);
          el.innerHTML = `<span>${makeContent(d)}</span>`;
          el.classList.add('filled');
          el.dataset.filled = '1';
          el.dataset.dragId = d.id;
          F[stateKey] = d.id;
          markUsed(d.id);
        });
        el.addEventListener('click', () => clearDZ(el, stateKey));
      }

      // COM LEFT
      const comLEl = dz('dz-com-left');
      if (hint !== 'meter') {
        makeDropzone(comLEl, d => d.id === 'com', () => {
          if (F['com'] === 'R') {
            const comR = dz('dz-com-right');
            if (comR) { comR.innerHTML=''; comR.classList.remove('filled'); delete comR.dataset.filled; delete comR.dataset.dragId; unmarkUsed('com'); }
          }
          comLEl.innerHTML = `COM`;
          comLEl.classList.add('filled'); comLEl.dataset.filled='1'; comLEl.dataset.dragId='com';
          F['com'] = 'L'; markUsed('com');
        });
        comLEl.addEventListener('click', () => clearDZ(comLEl,'com'));
      } else { comLEl.dataset.given='1'; }

      // COM RIGHT
      const comREl = dz('dz-com-right');
      if (hint !== 'meter') {
        makeDropzone(comREl, d => d.id === 'com', () => {
          if (F['com'] === 'L') {
            const comL = dz('dz-com-left');
            if (comL) { comL.innerHTML=''; comL.classList.remove('filled'); delete comL.dataset.filled; delete comL.dataset.dragId; unmarkUsed('com'); }
          }
          comREl.innerHTML = `COM`;
          comREl.classList.add('filled'); comREl.dataset.filled='1'; comREl.dataset.dragId='com';
          F['com'] = 'R'; markUsed('com');
        });
        comREl.addEventListener('click', () => clearDZ(comREl,'com'));
      } else { comREl.dataset.given='1'; }

      // ELECTRONS et CURRENT
      function setupEIZone(dzId, stateKey, needsFill) {
        const el = dz(dzId);
        if (!el) return;
        if (!needsFill) { el.dataset.given = '1'; return; }
        makeDropzone(el, d => ['d-e','d-i'].includes(d.id), d => {
          if (el.dataset.dragId) unmarkUsed(el.dataset.dragId);
          const isE = d.id === 'd-e';
          // Même couleur bleue pour e- et I
          el.innerHTML = isE
            ? `e⁻`
            : `I`;
          el.classList.add('filled');
          el.dataset.filled = '1';
          el.dataset.dragId = d.id;
          F[stateKey] = d.id;
          markUsed(d.id);
        });
        el.addEventListener('click', () => clearDZ(el, stateKey));
      }

      setupEIZone('dz-electrons', 'electrons', hint !== 'electrons');
      setupEIZone('dz-current',   'current',   hint !== 'current');

      // POLARITY
      const polNeed = hint !== 'polarity';
      simpleZone('dz-pol-l','pol_l',['d-plus','d-minus'],
        d => `${d.label}`, polNeed);
      simpleZone('dz-pol-r','pol_r',['d-plus','d-minus'],
        d => `${d.label}`, polNeed);

      // METAL / ION
      const allMIds = ['ml-'+leftCouple.id, 'ml-'+rightCouple.id];
      const allIIds = ['il-'+leftCouple.id, 'il-'+rightCouple.id];

      simpleZone('dz-metal-l','metal_l', allMIds,
        d => `${d.label}`, !gML);
      simpleZone('dz-ion-l','ion_l', allIIds,
        d => `${d.labelH}`, !gIL);
      simpleZone('dz-metal-r','metal_r', allMIds,
        d => `${d.label}`, !gMR);
      simpleZone('dz-ion-r','ion_r', allIIds,
        d => `${d.labelH}`, !gIR);

      // PONT SALIN
      const pontAccept = ['d-cat','d-an'];
      function setupPontZone(dzId, fkey) {
        const el = dz(dzId);
        if (!el) return;
        makeDropzone(el, d => pontAccept.includes(d.id), d => {
          if (el.dataset.dragId) unmarkUsed(el.dataset.dragId);
          const lbl = d.id === 'd-cat' ? 'cation +' : 'anion −';
          el.innerHTML = `${lbl}`;
          el.classList.add('filled'); el.dataset.filled='1'; el.dataset.dragId=d.id;
          F[fkey] = d.id;
          markUsed(d.id);
        });
        el.addEventListener('click', () => clearDZ(el, fkey));
      }
      setupPontZone('dz-pont-left', 'pont_left');
      setupPontZone('dz-pont-right', 'pont_right');
    }

    // =============================================
    // APPLY GIVEN VALUES
    // =============================================
    function applyGiven() {
      const { hint, gML, gIL, gMR, gIR, anodeSide, leftCouple, rightCouple } = Q;

      function setGiven(id, html, fkey, fval) {
        const el = $(id);
        if (!el) return;
        el.innerHTML = `<span>${html}</span>`;
        el.classList.add('given');
        el.dataset.given = '1';
        el.dataset.filled = '1';
        if (fkey) F[fkey] = fval;
      }

      if (hint === 'electrons') {
        setGiven('dz-electrons',`e⁻`,'electrons','d-e');
      }
      if (hint === 'current') {
        setGiven('dz-current',`I`,'current','d-i');
      }
      if (hint === 'polarity') {
        const minusSide = anodeSide === 'L' ? 'l' : 'r';
        const plusSide  = anodeSide === 'L' ? 'r' : 'l';
        setGiven(`dz-pol-${minusSide}`,'−',`pol_${minusSide}`,'d-minus');
        setGiven(`dz-pol-${plusSide}`, '+', `pol_${plusSide}`,'d-plus');
      }
      if (hint === 'meter') {
        const comSide = anodeSide === 'L' ? 'left' : 'right';
        const otherSide = anodeSide === 'L' ? 'right' : 'left';
        const comVal = anodeSide === 'L' ? 'L' : 'R';
        setGiven(`dz-com-${comSide}`,'COM','com', comVal);
        const otherEl = $(`dz-com-${otherSide}`);
        if (otherEl) { otherEl.innerHTML=''; otherEl.dataset.given='1'; otherEl.classList.add('pile-z-masque'); }
      }

      if (gML) setGiven('dz-metal-l',`${leftCouple.metal}`,'metal_l','ml-'+leftCouple.id);
      if (gIL) setGiven('dz-ion-l',`${leftCouple.ionH}`,'ion_l','il-'+leftCouple.id);
      if (gMR) setGiven('dz-metal-r',`${rightCouple.metal}`,'metal_r','ml-'+rightCouple.id);
      if (gIR) setGiven('dz-ion-r',`${rightCouple.ionH}`,'ion_r','il-'+rightCouple.id);
    }

    // =============================================
    // BANK SCHEMA
    // =============================================
    function renderBankSchema() {
      const { hint, gML, gIL, gMR, gIR, leftCouple, rightCouple } = Q;
      const bank = $('bank-schema');

      const items = [];

      if (hint !== 'meter') {
        items.push({ id:'com', label:'COM', title:'Borne COM' });
      }
      // e- et I en bleu commun
      if (hint !== 'electrons') items.push({ id:'d-e', label:'e⁻', title:'Sens des électrons' });
      if (hint !== 'current')   items.push({ id:'d-i', label:'I', title:'Sens du courant' });
      if (hint !== 'polarity') {
        items.push({ id:'d-plus',  label:'+', title:'Borne positive' });
        items.push({ id:'d-minus', label:'−', title:'Borne négative' });
      }

      items.push({ id:'d-cat', label:'cation +', title:'Cation (pont salin)' });
      items.push({ id:'d-an',  label:'anion −', title:'Anion (pont salin)' });

      if (!gML) items.push({ id:'ml-'+leftCouple.id,  label: leftCouple.metal,  labelH: leftCouple.metal, title:'Métal gauche' });
      if (!gIL) items.push({ id:'il-'+leftCouple.id,  label: leftCouple.ion,    labelH: leftCouple.ionH, title:'Ion gauche' });
      if (!gMR) items.push({ id:'ml-'+rightCouple.id, label: rightCouple.metal, labelH: rightCouple.metal, title:'Métal droit' });
      if (!gIR) items.push({ id:'il-'+rightCouple.id, label: rightCouple.ion,   labelH: rightCouple.ionH, title:'Ion droit' });

      bank.innerHTML = items.map(item => `
        <div class="drag-item" data-id="${item.id}"
             title="${item.title || ''}" role="button" aria-label="${item.title || ''} : ${item.label}">
          <span>${item.labelH || item.label}</span>
        </div>`).join('');

      bank.querySelectorAll('.drag-item').forEach(el => {
        const item = items.find(i => i.id === el.dataset.id);
        if (!item) return;
        makeDraggable(el, { id: item.id, label: item.label || '', labelH: item.labelH || item.label || '', couple: null });
      });
    }

    // =============================================
    // BANK LOWER
    // =============================================
    function renderBankLower() {
      const { anode, cathode, hint } = Q;
      const bank = $('bank-lower');
      const items = [];

      if (hint !== 'half_eqs_placed') {
        items.push({ id:'heq-anode',   labelH: anode.eqStdH, title:'Demi-équation anode',   type:'heq', couple: anode });
        items.push({ id:'heq-cathode', labelH: cathode.eqStdH, title:'Demi-équation cathode', type:'heq', couple: cathode });
      }

      items.push({ id:'d-ox',     label:'Oxydation', title:'Oxydation' });
      items.push({ id:'d-red',    label:'Réduction', title:'Réduction' });
      items.push({ id:'d-anode',  label:'Anode', title:'Anode' });
      items.push({ id:'d-cathode',label:'Cathode', title:'Cathode' });

      bank.innerHTML = items.map(item => `
        <div class="drag-item${item.type==='heq' ? ' pile-heq' : ''}" data-id="${item.id}"
             title="${item.title || ''}" role="button" aria-label="${item.title || ''}">
          <span>${item.labelH || item.label}</span>
        </div>`).join('');

      bank.querySelectorAll('.drag-item').forEach(el => {
        const item = items.find(i => i.id === el.dataset.id);
        if (!item) return;
        makeDraggable(el, { id: item.id, label: item.label || '', labelH: item.labelH || '', couple: item.couple || null });
      });
    }

    // =============================================
    // LOWER ZONES
    // =============================================
    const PH_HEQ = 'Déposer la demi-équation ici…';
    function renderLower() {
      const { anode, cathode } = Q;
      const wrap = $('lower-wrap');
      const colonne = (cote, nom) => `
        <div class="pile-demi">
          <div class="pile-demi-t">Demi-pile ${nom}</div>
          <div class="pile-champ">
            <div class="pile-zone-t">Demi-équation</div>
            <div id="${P}dz-heq-${cote}" class="heq-dz"><span class="pile-ph">${PH_HEQ}</span></div>
          </div>
          <div class="pile-champ">
            <div class="pile-zone-t">Type de réaction</div>
            <div id="${P}dz-oxred-${cote}" class="dz pile-dz-bas"><span class="pile-ph">Oxydation / Réduction ?</span></div>
          </div>
          <div>
            <div class="pile-zone-t">Électrode</div>
            <div id="${P}dz-elec-${cote}" class="dz pile-dz-bas"><span class="pile-ph">Anode / Cathode ?</span></div>
          </div>
        </div>`;
      wrap.innerHTML = `<div class="pile-lower-grid">${colonne('l', 'gauche')}${colonne('r', 'droite')}</div>`;

      setupHalfEqZone('dz-heq-l', 'l');
      setupHalfEqZone('dz-heq-r', 'r');
      setupSimpleLowerZone('dz-oxred-l','oxred_l',['d-ox','d-red'], d=>`${d.label}`);
      setupSimpleLowerZone('dz-oxred-r','oxred_r',['d-ox','d-red'], d=>`${d.label}`);
      setupSimpleLowerZone('dz-elec-l','elec_l',['d-anode','d-cathode'], d=>`${d.label}`);
      setupSimpleLowerZone('dz-elec-r','elec_r',['d-anode','d-cathode'], d=>`${d.label}`);

      if (Q.hint === 'half_eqs_placed') {
        const leftIsAnode = Q.anodeSide === 'L';
        if (leftIsAnode) {
          placeHalfEqGiven('dz-heq-l', anode, 'ox');
          placeHalfEqGiven('dz-heq-r', cathode, 'red');
        } else {
          placeHalfEqGiven('dz-heq-l', cathode, 'red');
          placeHalfEqGiven('dz-heq-r', anode, 'ox');
        }
      }
    }

    function setupHalfEqZone(dzId, side) {
      const el = $(dzId);
      if (!el) return;
      if (Q.hint === 'half_eqs_placed') { el.dataset.given='1'; return; }

      makeDropzone(el, d => ['heq-anode','heq-cathode'].includes(d.id), d => {
        const couple = d.couple;
        const prevDragId = el.dataset.dragId;
        if (prevDragId) unmarkUsed(prevDragId);
        fillHalfEqZone(el, couple, 'std', side);
        markUsed(d.id);
      });
    }

    function fillHalfEqZone(el, couple, dir, side) {
      const eqH = (dir === 'ox') ? couple.eqOxH
                 : (dir === 'red') ? couple.eqRedH
                 : couple.eqStdH;
      el.innerHTML = `
        <span id="${P}heq-txt-${side}" class="pile-heq-txt">${eqH}</span>
        <button type="button" class="btn-small pile-flip" data-act="flipHEQ" data-side="${side}" data-couple="${couple.id}" aria-label="Changer le sens de la demi-équation" title="Changer le sens">⇌</button>
        <button type="button" class="pile-retirer" data-act="rmHEQ" data-side="${side}" aria-label="Retirer la demi-équation" title="Retirer">✕</button>`;
      el.classList.add('filled');
      el.dataset.filled='1';
      el.dataset.coupleId = couple.id;
      el.dataset.dir = dir;
      el.dataset.dragId = 'heq-'+(couple.id === Q.anode.id ? 'anode' : 'cathode');
      F['heq_'+side] = { coupleId: couple.id, dir };
    }

    function placeHalfEqGiven(dzId, couple, dir) {
      const el = $(dzId);
      if (!el) return;
      const eqH = dir === 'ox' ? couple.eqOxH : couple.eqRedH;
      el.innerHTML = `<span class="pile-heq-txt">${eqH}</span>`;
      el.classList.add('given');
      el.dataset.given='1'; el.dataset.filled='1';
      el.dataset.coupleId = couple.id; el.dataset.dir = dir;
      const side = dzId.endsWith('l') ? 'l' : 'r';
      F['heq_'+side] = { coupleId: couple.id, dir };
    }

    function flipHEQ(side, coupleId) {
      if (locked) return;
      const el = $('dz-heq-'+side);
      if (!el || el.dataset.given) return;
      const couple = COUPLES.find(c => c.id === coupleId);
      if (!couple) return;
      const cur = el.dataset.dir;
      let newDir;
      if (cur === 'std') newDir = 'ox';
      else if (cur === 'ox') newDir = 'red';
      else newDir = 'std';
      el.dataset.dir = newDir;
      const eqH = newDir === 'ox' ? couple.eqOxH
                 : newDir === 'red' ? couple.eqRedH
                 : couple.eqStdH;
      const txtEl = $('heq-txt-'+side);
      if (txtEl) txtEl.innerHTML = eqH;
      F['heq_'+side] = { coupleId: couple.id, dir: newDir };
    }

    function rmHEQ(side) {
      if (locked) return;
      const el = $('dz-heq-'+side);
      if (!el || el.dataset.given) return;
      const did = el.dataset.dragId;
      el.innerHTML = `<span class="pile-ph">${PH_HEQ}</span>`;
      el.classList.remove('filled','correct','incorrect');
      delete el.dataset.filled; delete el.dataset.coupleId; delete el.dataset.dir; delete el.dataset.dragId;
      F['heq_'+side] = null;
      if (did) unmarkUsed(did);
    }

    function setupSimpleLowerZone(dzId, fkey, acceptIds, mkHtml) {
      const el = $(dzId);
      if (!el) return;
      makeDropzone(el, d => acceptIds.includes(d.id), d => {
        if (el.dataset.dragId) unmarkUsed(el.dataset.dragId);
        el.innerHTML = `<span>${mkHtml(d)}</span>`;
        el.classList.add('filled'); el.dataset.filled='1'; el.dataset.dragId=d.id;
        F[fkey] = d.id;
        markUsed(d.id);
      });
      el.addEventListener('click', () => {
        if (!locked && el.dataset.filled && !el.dataset.given) {
          if (el.dataset.dragId) unmarkUsed(el.dataset.dragId);
          el.innerHTML = el.id.includes('oxred')
            ? `<span class="pile-ph">Oxydation / Réduction ?</span>`
            : `<span class="pile-ph">Anode / Cathode ?</span>`;
          el.classList.remove('filled','correct','incorrect');
          delete el.dataset.filled; delete el.dataset.dragId;
          F[fkey] = null;
        }
      });
    }

    // =============================================
    // EQUATION DE LA PILE
    // =============================================
    let eqL = [], eqR = [];

    function renderEq() {
      eqL = []; eqR = [];
      const { anode, cathode } = Q;
      const allSp = [
        { id:'sp-m-'+anode.id,   label: anode.metal,   html: anode.metal,   type:'metal', coupleId: anode.id },
        { id:'sp-i-'+anode.id,   label: anode.ion,     html: anode.ionH,    type:'ion',   coupleId: anode.id },
        { id:'sp-m-'+cathode.id, label: cathode.metal, html: cathode.metal, type:'metal', coupleId: cathode.id },
        { id:'sp-i-'+cathode.id, label: cathode.ion,   html: cathode.ionH,  type:'ion',   coupleId: cathode.id },
      ];

      const wrap = $('eq-wrap');
      wrap.innerHTML = `
        <div class="pile-banque">
          ${sousTitre('Espèces à placer dans l\'équation')}
          <div class="pile-banque-l">
            ${allSp.map(s=>`<div class="drag-item" data-id="${s.id}" data-type="sp" title="${s.label}" role="button" aria-label="Espèce ${s.label}"><span>${s.html}</span></div>`).join('')}
          </div>
        </div>
        <div class="pile-eq-ligne">
          <div>
            <div class="pile-zone-t">Réactifs</div>
            <div id="${P}eq-l" class="eq-side"><span class="pile-ph">Glisser ici…</span></div>
          </div>
          <div class="pile-eq-fleche">→</div>
          <div>
            <div class="pile-zone-t">Produits</div>
            <div id="${P}eq-r" class="eq-side"><span class="pile-ph">Glisser ici…</span></div>
          </div>
        </div>`;

      wrap.querySelectorAll('.drag-item[data-type="sp"]').forEach(el => {
        const sp = allSp.find(s => s.id === el.dataset.id);
        makeDraggable(el, { id: el.dataset.id, type:'sp', sp });
      });

      ['l','r'].forEach(side => {
        const el = $('eq-'+side);
        makeDropzone(el, d => d.type === 'sp', d => {
          const arr = side === 'l' ? eqL : eqR;
          // Vérifier si déjà présent dans l'un ou l'autre côté
          if (eqL.find(x => x.id === d.sp.id) || eqR.find(x => x.id === d.sp.id)) return;
          arr.push({ ...d.sp, coeff: 1 });
          // Masquer l'item dans la banque
          hideSpItem(d.sp.id);
          refreshEq(side);
        });
      });
    }

    function refreshEq(side) {
      const el = $('eq-'+side);
      const arr = side === 'l' ? eqL : eqR;
      if (arr.length === 0) {
        el.innerHTML = `<span class="pile-ph">Glisser ici…</span>`;
        return;
      }
      el.innerHTML = arr.map((sp, i) => `
        <div class="eq-chip">
          <div class="pile-coef-stepper">
            <button type="button" class="pile-coef-btn" data-act="chgCoeff" data-side="${side}" data-i="${i}" data-delta="1" aria-label="Augmenter le nombre stœchiométrique">▲</button>
            <span class="coeff-disp">${sp.coeff}</span>
            <button type="button" class="pile-coef-btn" data-act="chgCoeff" data-side="${side}" data-i="${i}" data-delta="-1" aria-label="Diminuer le nombre stœchiométrique">▼</button>
          </div>
          <span class="pile-esp">${sp.html}</span>
          <button type="button" class="pile-retirer" data-act="rmFromEq" data-side="${side}" data-i="${i}" aria-label="Retirer cette espèce" title="Retirer">✕</button>
        </div>
        ${i < arr.length-1 ? '<span class="pile-plus">+</span>' : ''}`).join('');
    }

    function chgCoeff(side, idx, delta) {
      if (locked) return;
      const arr = side === 'l' ? eqL : eqR;
      arr[idx].coeff = Math.max(1, arr[idx].coeff + delta);
      refreshEq(side);
    }

    function rmFromEq(side, idx) {
      if (locked) return;
      const arr = side === 'l' ? eqL : eqR;
      const removed = arr.splice(idx, 1);
      // Réafficher l'item dans la banque
      if (removed.length > 0) showSpItem(removed[0].id);
      refreshEq(side);
    }

    // =============================================
    // DATA ZONE
    // =============================================
    function renderData() {
      const { anode, cathode, hint, anodeSide } = Q;
      let html = `<p style="font-weight:700;margin-bottom:6px;">Couples oxydant/réducteur :</p>
      <ul class="pile-couples">
        <li><strong>${anode.label}</strong> : ${anode.eqStdH}</li>
        <li><strong>${cathode.label}</strong> : ${cathode.eqStdH}</li>
      </ul>`;

      if (hint === 'meter') {
        const comSideLabel = anodeSide === 'L' ? 'gauche' : 'droite';
        html += Q.appareil === 'A'
          ? `<p>L'ampèremètre est branché avec la borne <strong>COM côté ${comSideLabel}</strong>. Il affiche une valeur <strong>positive</strong>.</p>`
          : `<p>Le voltmètre est branché avec la borne <strong>COM côté ${comSideLabel}</strong> (borne négative de la pile). Il indique une valeur <strong>positive</strong>.</p>`;
      } else if (hint === 'electrons') {
        const fromSide = anodeSide === 'L' ? 'gauche' : 'droite';
        const toSide   = anodeSide === 'L' ? 'droite' : 'gauche';
        html += `<p>Les électrons e⁻ sont représentés sur le schéma : ils circulent de la <strong>demi-pile ${fromSide} vers la demi-pile ${toSide}</strong> dans le circuit extérieur.</p>`;
      } else if (hint === 'current') {
        const fromSide = anodeSide === 'L' ? 'droite' : 'gauche';
        const toSide   = anodeSide === 'L' ? 'gauche' : 'droite';
        html += `<p>Le courant I est représenté sur le schéma : il circule de la <strong>demi-pile ${fromSide} vers la demi-pile ${toSide}</strong> dans le circuit extérieur.</p>`;
      } else if (hint === 'polarity') {
        const minusSide = anodeSide === 'L' ? 'gauche' : 'droite';
        const plusSide  = anodeSide === 'L' ? 'droite' : 'gauche';
        html += `<p>La polarité est représentée sur le schéma : la borne <strong>négative (−)</strong> est côté <strong>${minusSide}</strong>, la borne <strong>positive (+)</strong> est côté <strong>${plusSide}</strong>.</p>`;
      } else if (hint === 'half_eqs_placed') {
        html += `<p>Les demi-équations de fonctionnement sont déjà placées dans les zones correspondantes, dans leur sens correct de fonctionnement.</p>`;
      } else if (hint === 'consomme') {
        // ce qu'on observe (exercice) : l'électrode de l'anode est consommée, un dépôt se forme sur l'autre
        const cA = anodeSide === 'L' ? 'gauche' : 'droite', cC = anodeSide === 'L' ? 'droite' : 'gauche';
        html += `<p>Demi-pile ${cA} : électrode ${anode.de} ; demi-pile ${cC} : électrode ${cathode.de}. On observe que l'électrode ${anode.de} est <strong>consommée</strong> et qu'un <strong>dépôt ${cathode.de}</strong> se forme sur l'électrode ${cathode.de}.</p>`;
      }

      $('data-wrap').innerHTML = html;
    }

    // Encadrés de résultat (couleurs du juste / faux : variables du thème)
    const boiteOk = t => `<div class="pile-hint pile-hint-ok"><strong>✓ ${t}</strong></div>`;
    const boiteErreurs = (n, ou, lignes) => `<div class="pile-hint pile-hint-err">
          <strong>⚠ ${n} réponse${n>1?'s':''} incorrecte${n>1?'s':''} ou manquante${n>1?'s':''} ${ou} :</strong>
          <ul>${lignes}</ul>
        </div>`;
    // libellé de la borne COM de l'appareil de mesure
    const libelleCom = () => (Q.appareil === 'A' ? 'Borne COM de l\'ampèremètre' : 'Borne COM du voltmètre');
    function erreurIntermediaire() {
      // en partie d'exercice, une vérification fausse compte comme une erreur
      if (enPartie && opts.partie.compterErreur) opts.partie.compterErreur();
    }

    // =============================================
    // VÉRIFICATION INTERMÉDIAIRE — SCHÉMA SEUL
    // =============================================
    function checkSchema() {
      if (locked) return;
      const { hint, anodeSide, leftCouple, rightCouple } = Q;

      const schemaErrors = [];

      function chk(cond, label) {
        if (!cond) schemaErrors.push(label);
      }

      if (hint !== 'electrons') chk(F['electrons'] === 'd-e', 'Sens des électrons (e⁻)');
      if (hint !== 'current')   chk(F['current']   === 'd-i', 'Sens du courant (I)');
      if (hint !== 'meter') {
        const correctCom = anodeSide === 'L' ? 'L' : 'R';
        chk(F['com'] === correctCom, libelleCom());
      }
      if (hint !== 'polarity') {
        const minusSide = anodeSide === 'L' ? 'pol_l' : 'pol_r';
        const plusSide  = anodeSide === 'L' ? 'pol_r' : 'pol_l';
        chk(F[minusSide] === 'd-minus', 'Polarité (borne −)');
        chk(F[plusSide]  === 'd-plus',  'Polarité (borne +)');
      }

      const catFkey = anodeSide === 'L' ? 'pont_right' : 'pont_left';
      const anFkey  = anodeSide === 'L' ? 'pont_left'  : 'pont_right';
      chk(F[catFkey] === 'd-cat' && F[anFkey] === 'd-an', 'Migration des ions dans le pont salin');

      if (!Q.gML) chk(F['metal_l'] === 'ml-'+leftCouple.id,  'Métal de la demi-pile gauche');
      if (!Q.gIL) chk(F['ion_l']   === 'il-'+leftCouple.id,  'Ion de la demi-pile gauche');
      if (!Q.gMR) chk(F['metal_r'] === 'ml-'+rightCouple.id, 'Métal de la demi-pile droite');
      if (!Q.gIR) chk(F['ion_r']   === 'il-'+rightCouple.id, 'Ion de la demi-pile droite');

      const hw = $('hints-schema');

      if (schemaErrors.length === 0) {
        hw.innerHTML = boiteOk('Schéma correct !');
      } else {
        // Marquer hasError seulement si le schéma est faux
        hasError = true;
        erreurIntermediaire();
        hw.innerHTML = boiteErreurs(schemaErrors.length, 'dans le schéma', schemaErrors.map(e => `<li>${e}</li>`).join(''));
      }
    }

    // =============================================
    // VÉRIFICATION INTERMÉDIAIRE — DEMI-PILES SEULES
    // =============================================
    function checkDemiPiles() {
      if (locked) return;
      const { hint, anodeSide, leftCouple, rightCouple } = Q;

      const otherErrors = [];

      function chk(cond, label) {
        if (!cond) otherErrors.push(label);
      }

      if (hint !== 'half_eqs_placed') {
        const leftExpectedDir  = anodeSide === 'L' ? 'ox' : 'red';
        const rightExpectedDir = anodeSide === 'L' ? 'red' : 'ox';

        function dirOk(dir, expectedDir) {
          if (expectedDir === 'red') return dir === 'red' || dir === 'std';
          return dir === expectedDir;
        }

        const heL = F['heq_l'];
        chk(heL && heL.coupleId === leftCouple.id  && dirOk(heL.dir, leftExpectedDir),  'Demi-équation gauche');
        const heR = F['heq_r'];
        chk(heR && heR.coupleId === rightCouple.id && dirOk(heR.dir, rightExpectedDir), 'Demi-équation droite');
      }

      const oxredLCorrect = anodeSide === 'L' ? 'd-ox' : 'd-red';
      const oxredRCorrect = anodeSide === 'L' ? 'd-red' : 'd-ox';
      chk(F['oxred_l'] === oxredLCorrect, 'Type de réaction (demi-pile gauche)');
      chk(F['oxred_r'] === oxredRCorrect, 'Type de réaction (demi-pile droite)');

      const elecLCorrect = anodeSide === 'L' ? 'd-anode'   : 'd-cathode';
      const elecRCorrect = anodeSide === 'L' ? 'd-cathode'  : 'd-anode';
      chk(F['elec_l'] === elecLCorrect, 'Électrode gauche (anode ou cathode)');
      chk(F['elec_r'] === elecRCorrect, 'Électrode droite (anode ou cathode)');

      const hw = $('hints-demipiles');

      if (otherErrors.length === 0) {
        hw.innerHTML = boiteOk('Demi-piles correctes !');
      } else {
        // Marquer hasError seulement si les demi-piles sont fausses
        hasError = true;
        erreurIntermediaire();
        hw.innerHTML = boiteErreurs(otherErrors.length, 'dans les demi-piles', otherErrors.map(e => `<li>${e}</li>`).join(''));
      }
    }

    // =============================================
    // CHECK ANSWER
    // =============================================
    function checkAnswer() {
      if (locked) return;
      const { hint, anodeSide, leftCouple, rightCouple } = Q;

      const schemaErrors = [];
      const otherErrors  = [];

      function chkSchema(cond, label) {
        if (!cond) schemaErrors.push(label);
      }
      function chkOther(cond, label) {
        if (!cond) otherErrors.push(label);
      }

      // ---- SCHEMA ----
      if (hint !== 'electrons') {
        chkSchema(F['electrons'] === 'd-e', 'Sens des électrons (e⁻)');
      }
      if (hint !== 'current') {
        chkSchema(F['current'] === 'd-i', 'Sens du courant (I)');
      }
      if (hint !== 'meter') {
        const correctCom = anodeSide === 'L' ? 'L' : 'R';
        chkSchema(F['com'] === correctCom, libelleCom());
      }
      if (hint !== 'polarity') {
        const minusSide = anodeSide === 'L' ? 'pol_l' : 'pol_r';
        const plusSide  = anodeSide === 'L' ? 'pol_r' : 'pol_l';
        chkSchema(F[minusSide] === 'd-minus', 'Polarité (borne −)');
        chkSchema(F[plusSide]  === 'd-plus',  'Polarité (borne +)');
      }

      const catFkey = anodeSide === 'L' ? 'pont_right' : 'pont_left';
      const anFkey  = anodeSide === 'L' ? 'pont_left'  : 'pont_right';
      chkSchema(F[catFkey] === 'd-cat' && F[anFkey] === 'd-an', 'Migration des ions dans le pont salin');

      if (!Q.gML) chkSchema(F['metal_l'] === 'ml-'+leftCouple.id,  'Métal de la demi-pile gauche');
      if (!Q.gIL) chkSchema(F['ion_l']   === 'il-'+leftCouple.id,  'Ion de la demi-pile gauche');
      if (!Q.gMR) chkSchema(F['metal_r'] === 'ml-'+rightCouple.id, 'Métal de la demi-pile droite');
      if (!Q.gIR) chkSchema(F['ion_r']   === 'il-'+rightCouple.id, 'Ion de la demi-pile droite');

      // ---- AUTRE ----
      if (hint !== 'half_eqs_placed') {
        const leftExpectedCoupleId  = leftCouple.id;
        const leftExpectedDir       = anodeSide === 'L' ? 'ox' : 'red';
        const rightExpectedCoupleId = rightCouple.id;
        const rightExpectedDir      = anodeSide === 'L' ? 'red' : 'ox';

        function dirOk(dir, expectedDir) {
          if (expectedDir === 'red') return dir === 'red' || dir === 'std';
          return dir === expectedDir;
        }

        const heL = F['heq_l'];
        const heqLok = heL && heL.coupleId === leftExpectedCoupleId && dirOk(heL.dir, leftExpectedDir);
        chkOther(heqLok, 'Demi-équation gauche');

        const heR = F['heq_r'];
        const heqRok = heR && heR.coupleId === rightExpectedCoupleId && dirOk(heR.dir, rightExpectedDir);
        chkOther(heqRok, 'Demi-équation droite');
      }

      const oxredLCorrect = anodeSide === 'L' ? 'd-ox' : 'd-red';
      const oxredRCorrect = anodeSide === 'L' ? 'd-red' : 'd-ox';
      chkOther(F['oxred_l'] === oxredLCorrect, 'Type de réaction (demi-pile gauche)');
      chkOther(F['oxred_r'] === oxredRCorrect, 'Type de réaction (demi-pile droite)');

      const elecLCorrect = anodeSide === 'L' ? 'd-anode'   : 'd-cathode';
      const elecRCorrect = anodeSide === 'L' ? 'd-cathode'  : 'd-anode';
      chkOther(F['elec_l'] === elecLCorrect, 'Électrode gauche (anode ou cathode)');
      chkOther(F['elec_r'] === elecRCorrect, 'Électrode droite (anode ou cathode)');

      const eqCheck = checkEqDetailed();

      const totalErrors = schemaErrors.length + otherErrors.length + (eqCheck.correct ? 0 : 1);
      const hw = $('hints-wrap');

      if (totalErrors === 0) {
        locked = true;
        const pts = hasError ? 1 : 2;
        if (enPartie) {
          // partie d'exercice : le moteur de l'exercice compte les points
          hw.innerHTML = boiteOk('Toutes les réponses sont correctes !');
          opts.partie.reussi();
          return;
        }
        totalScore += pts;
        recap.push(pts);
        progression();
        hw.innerHTML = `<div class="pile-hint pile-hint-ok">
          <strong style="font-size:15px;">✓ Bravo ! Toutes les réponses sont correctes !</strong><br>
          <span>Tu gagnes <strong>${pts} point${pts>1?'s':''}</strong> pour cette question.</span>
        </div>`;
        montrerSuivant();
        return;
      }

      hasError = true;

      const schemaCount = schemaErrors.length;
      const otherCount  = otherErrors.length;

      // Encadré d'une partie (schéma, demi-piles, équation) : juste ou à corriger
      const boite = (ok, titre, html) => `<div class="pile-part ${ok ? 'pile-part-ok' : 'pile-part-ko'}">
          <div class="pile-part-t">${titre}</div>${html}</div>`;
      const nbFaux = n => `<div class="pile-part-l">✗ ${n} réponse${n>1?'s':''} incorrecte${n>1?'s':''} ou manquante${n>1?'s':''}.</div>`;
      const toutJuste = '<div class="pile-part-l">✓ Toutes les réponses sont correctes.</div>';

      // Encadré 1 — Schéma
      const boxSchema = boite(schemaCount === 0, 'Schéma', schemaCount === 0 ? toutJuste : nbFaux(schemaCount));

      // Encadré 2 — Demi-piles
      const boxDemi = boite(otherCount === 0, 'Demi-piles', otherCount === 0 ? toutJuste : nbFaux(otherCount));

      // Encadré 3 — Équation
      let boxEq;
      if (eqCheck.correct) {
        boxEq = boite(true, 'Équation de fonctionnement', '<div class="pile-part-l">✓ L\'équation est correcte.</div>');
      } else {
        let eqDetails = '';
        if (!eqCheck.placementOk) {
          eqDetails += `<div class="pile-part-l"><strong>Espèces mal placées :</strong>
            <ul>${eqCheck.placementHints.map(h=>`<li>${h}</li>`).join('')}</ul></div>`;
        } else {
          eqDetails += `<div class="pile-part-l">✓ Les espèces sont placées du bon côté.</div>`;
        }
        if (!eqCheck.coeffOk && eqCheck.placementOk) {
          eqDetails += `<div class="pile-part-l"><strong>Nombres stœchiométriques :</strong>
            <ul>${eqCheck.coeffHints.map(h=>`<li>${h}</li>`).join('')}</ul></div>`;
        } else if (eqCheck.placementOk) {
          eqDetails += `<div class="pile-part-l">✓ Les nombres stœchiométriques sont corrects.</div>`;
        }
        boxEq = boite(false, 'Équation de fonctionnement', eqDetails);
      }

      hw.innerHTML = `<div class="pile-hint pile-hint-err">
        <strong>⚠ Réponses incorrectes ou incomplètes : corrige et vérifie à nouveau.</strong>
        <div class="pile-parts">${boxSchema}${boxDemi}${boxEq}</div>
      </div>`;
      if (enPartie) opts.partie.erreur('Corrige les parties signalées ci-dessus, puis vérifie à nouveau.');
    }

    // =============================================
    // CHECK EQUATION (détaillé avec indices)
    // =============================================
    function checkEqDetailed() {
      const { anode, cathode } = Q;
      const nA = anode.n, nC = cathode.n;
      const L = lcm(nA, nC);
      const cA = L / nA, cC = L / nC;

      if (eqL.length === 0 && eqR.length === 0) {
        return { correct: false, placementOk: false, coeffOk: false,
          placementHints: ["L'équation est vide. Fais glisser les espèces chimiques dans les zones Réactifs et Produits."],
          coeffHints: [] };
      }

      const rMetal  = eqL.find(x => x.id === 'sp-m-'+anode.id);
      const rIon    = eqL.find(x => x.id === 'sp-i-'+cathode.id);
      const pIon    = eqR.find(x => x.id === 'sp-i-'+anode.id);
      const pMetal  = eqR.find(x => x.id === 'sp-m-'+cathode.id);

      const wrongSideReactif = eqL.find(x => x.id === 'sp-i-'+anode.id || x.id === 'sp-m-'+cathode.id);
      const wrongSideProduit = eqR.find(x => x.id === 'sp-m-'+anode.id || x.id === 'sp-i-'+cathode.id);

      const placementHints = [];
      const coeffHints = [];

      if (wrongSideReactif || wrongSideProduit) {
        placementHints.push(`Sens de la réaction incorrect : le métal qui s'oxyde et l'ion qui se réduit sont les réactifs (gauche) ; leurs homologues sont les produits (droite).`);
      } else {
        if (!rMetal) placementHints.push(`Le métal ${anode.metal} (qui s'oxyde) doit être placé dans les réactifs.`);
        if (!rIon)   placementHints.push(`L'ion ${cathode.ion} (qui se réduit) doit être placé dans les réactifs.`);
        if (!pIon)   placementHints.push(`L'ion ${anode.ion} (produit de l'oxydation) doit être placé dans les produits.`);
        if (!pMetal) placementHints.push(`Le métal ${cathode.metal} (produit de la réduction) doit être placé dans les produits.`);
      }

      const placementOk = placementHints.length === 0;

      if (placementOk) {
        const coeffsCorrect = rMetal.coeff === cA && rIon.coeff === cC && pIon.coeff === cA && pMetal.coeff === cC;
        if (!coeffsCorrect) {
          if (cA === 1 && cC === 1) {
            coeffHints.push(`Les nombres stœchiométriques sont incorrects. Ici, ils sont tous égaux à 1.`);
          } else {
            coeffHints.push(`Les nombres stœchiométriques sont incorrects. Pour équilibrer les électrons échangés, il faut multiplier chaque demi-équation afin que le nombre d'électrons soit le même des deux côtés (${anode.n} e⁻ pour ${anode.label}, ${cathode.n} e⁻ pour ${cathode.label}).`);
          }
        }
        const coeffOk = coeffHints.length === 0;
        return { correct: coeffOk && placementOk, placementOk, coeffOk, placementHints, coeffHints };
      }

      return { correct: false, placementOk: false, coeffOk: false, placementHints, coeffHints };
    }

    // =============================================
    // SHOW ANSWER
    // =============================================
    function showAnswer() {
      if (locked) return;
      locked = true;
      hasError = true;
      const { anode, cathode, hint, anodeSide, leftCouple, rightCouple } = Q;

      function force(id, html, fkey, fval) {
        const el = $(id);
        if (!el || el.dataset.given) return;
        el.innerHTML = `<span>${html}</span>`;
        el.classList.remove('incorrect');
        el.classList.add('filled','correct');
        el.dataset.filled = '1';
        if (fkey) F[fkey] = fval;
      }

      if (hint !== 'electrons') force('dz-electrons',`e⁻`,'electrons','d-e');
      if (hint !== 'current')   force('dz-current',  `I`,'current','d-i');

      if (hint !== 'meter') {
        const comSide   = anodeSide === 'L' ? 'left' : 'right';
        const otherSide = anodeSide === 'L' ? 'right' : 'left';
        const comVal    = anodeSide === 'L' ? 'L' : 'R';
        force(`dz-com-${comSide}`,'COM','com', comVal);
        const otherEl = $(`dz-com-${otherSide}`);
        if (otherEl && !otherEl.dataset.given) { otherEl.innerHTML=''; otherEl.classList.remove('filled','correct','incorrect'); otherEl.classList.add('pile-z-masque'); }
      }

      if (hint !== 'polarity') {
        const minusSide = anodeSide === 'L' ? 'l' : 'r';
        const plusSide  = anodeSide === 'L' ? 'r' : 'l';
        force(`dz-pol-${minusSide}`,'−',`pol_${minusSide}`,'d-minus');
        force(`dz-pol-${plusSide}`, '+', `pol_${plusSide}`,'d-plus');
      }

      const catZone = anodeSide === 'L' ? 'dz-pont-right' : 'dz-pont-left';
      const anZone  = anodeSide === 'L' ? 'dz-pont-left'  : 'dz-pont-right';
      const catFkey = catZone === 'dz-pont-right' ? 'pont_right' : 'pont_left';
      const anFkey  = anZone  === 'dz-pont-right' ? 'pont_right' : 'pont_left';
      force(catZone,'cation +',catFkey,'d-cat');
      force(anZone, 'anion −', anFkey, 'd-an');

      if (!Q.gML) force('dz-metal-l',`${leftCouple.metal}`,'metal_l','ml-'+leftCouple.id);
      if (!Q.gIL) force('dz-ion-l',  `${leftCouple.ionH}`,'ion_l','il-'+leftCouple.id);
      if (!Q.gMR) force('dz-metal-r',`${rightCouple.metal}`,'metal_r','ml-'+rightCouple.id);
      if (!Q.gIR) force('dz-ion-r',  `${rightCouple.ionH}`,'ion_r','il-'+rightCouple.id);

      if (hint !== 'half_eqs_placed') {
        ['l','r'].forEach(side => {
          const el = $('dz-heq-'+side);
          if (!el || el.dataset.given) return;
          const couple = side === 'l' ? leftCouple : rightCouple;
          const dir = (side === 'l') ? (anodeSide === 'L' ? 'ox' : 'red') : (anodeSide === 'L' ? 'red' : 'ox');
          const eqH = dir === 'ox' ? couple.eqOxH : couple.eqRedH;
          el.innerHTML = `<span class="pile-heq-txt">${eqH}</span>`;
          el.classList.add('filled','correct'); el.dataset.filled='1';
          F['heq_'+side] = { coupleId: couple.id, dir };
        });
      }

      const oxredLCorrect = anodeSide === 'L' ? 'Oxydation' : 'Réduction';
      const oxredRCorrect = anodeSide === 'L' ? 'Réduction' : 'Oxydation';
      const oxredLFval    = anodeSide === 'L' ? 'd-ox' : 'd-red';
      const oxredRFval    = anodeSide === 'L' ? 'd-red' : 'd-ox';
      const elecLLabel    = anodeSide === 'L' ? 'Anode' : 'Cathode';
      const elecRLabel    = anodeSide === 'L' ? 'Cathode' : 'Anode';
      const elecLFval     = anodeSide === 'L' ? 'd-anode' : 'd-cathode';
      const elecRFval     = anodeSide === 'L' ? 'd-cathode' : 'd-anode';

      force('dz-oxred-l',`${oxredLCorrect}`,'oxred_l',oxredLFval);
      force('dz-oxred-r',`${oxredRCorrect}`,'oxred_r',oxredRFval);
      force('dz-elec-l', `${elecLLabel}`,   'elec_l', elecLFval);
      force('dz-elec-r', `${elecRLabel}`,   'elec_r', elecRFval);

      // Équation : forcer l'affichage et masquer les items de la banque
      const L2 = lcm(anode.n, cathode.n);
      const cA = L2/anode.n, cC = L2/cathode.n;
      eqL = [
        { id:'sp-m-'+anode.id,   html: anode.metal,   coeff: cA },
        { id:'sp-i-'+cathode.id, html: cathode.ionH,  coeff: cC }
      ];
      eqR = [
        { id:'sp-i-'+anode.id,   html: anode.ionH,    coeff: cA },
        { id:'sp-m-'+cathode.id, html: cathode.metal, coeff: cC }
      ];
      // Masquer tous les items de la banque equation
      ['sp-m-'+anode.id, 'sp-i-'+anode.id, 'sp-m-'+cathode.id, 'sp-i-'+cathode.id].forEach(id => hideSpItem(id));
      refreshEq('l'); refreshEq('r');
      $('eq-l').classList.add('correct');
      $('eq-r').classList.add('correct');

      if (enPartie) { $('hints-wrap').innerHTML = ''; return; }
      recap.push(0);
      progression();
      $('hints-wrap').innerHTML = `<div class="pile-hint pile-hint-ans">
        <strong>Réponse affichée : 0 point pour cette question.</strong><br>
        <span>Analyse bien la correction avant de passer à la question suivante.</span>
      </div>`;
      montrerSuivant();
    }

    // bouton « Question suivante » (désactivé un court instant : pas de double appui)
    function montrerSuivant() {
      const b = $('btn-next');
      if (!b) return;
      b.textContent = qIdx >= NB() - 1 ? 'Voir mon score →' : 'Question suivante →';
      b.style.display = 'inline-block';
      b.disabled = true;
      setTimeout(() => { b.disabled = false; }, 450);
      setTimeout(() => b.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }

    // =============================================
    // NAVIGATION
    // =============================================
    function nextQ() {
      qIdx++;
      if (qIdx >= NB()) {
        showEnd();
      } else {
        renderQ();
        // nouvelle question : retour en haut de l'outil, et pas de double appui
        root.style.pointerEvents = 'none';
        setTimeout(() => { root.style.pointerEvents = ''; }, 350);
        window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 70) });
      }
    }

    function showEnd() {
      $('q-screen').style.display = 'none';
      const fin = $('end-screen');
      fin.style.display = 'block';
      if ($('prog')) $('prog').style.width = '100%';

      const s = totalScore, max = NB() * 2;
      const note = Math.round(s / max * 20 * 2) / 2, pct = Math.round(s / max * 100);

      let msg;
      if (s >= 18)      { msg='Parfait ! Tu maîtrises les piles électrochimiques !'; }
      else if (s >= 14) { msg='Très bien ! Quelques imperfections, mais l\'essentiel est maîtrisé.'; }
      else if (s >= 10) { msg='Assez bien. Revois les points d\'erreur et continue à t\'entraîner.'; }
      else if (s >= 6)  { msg='Des lacunes à combler. Revois le cours sur les piles et l\'oxydoréduction.'; }
      else              { msg='Courage ! La pratique régulière t\'aidera à progresser rapidement.'; }

      fin.innerHTML = `${opts.entete ? `<span class="er-badge">${opts.entete.badge}</span>` : ''}<h2 class="er-titre">Résultats finaux</h2>
        ${s === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${String(note).replace('.', ',')} / 20</div><p class="er-score-pct">${pct} %</p>
        <p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map((p, k) => `<div class="${p === 2 ? 'ok' : p === 1 ? 'moyen' : 'ko'}">Q${k + 1}<b>${p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-act="restart">↺ Recommencer avec d'autres questions</button>
        ${opts.finActions || ''}</div>`;
      window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 70) });
      if (opts.fin) opts.fin(note);
      if (s === max) confettis();
    }

    function restart() {
      totalScore = 0; qIdx = 0; recap = [];
      $('end-screen').style.display = 'none';
      $('q-screen').style.display = 'block';
      questions = opts.questions ? opts.questions.map(questionFixe) : genQuestions();
      renderQ();
      window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 70) });
    }

    // =============================================
    // INIT
    // =============================================
    questions = opts.questions ? opts.questions.map(questionFixe) : genQuestions();
    renderQ();

    return { recommencer: restart, montrer: showAnswer };
  }

  window.PILE = { monter, COUPLES };
})();
