/* ============================================================
   Moteur « Schéma d'une pile » (pile électrochimique)
   Source unique, chargée par :
     - pile/index.html (application « Schéma d'une pile », Tle spécialité et STI2D) ;
     - oxydoreduction-STI2D/modules/module_5_pile.html (Chapitre 15, module 5) ;
     - oxydoreduction-STI2D/modules/module_6.html (exercices 8 et 9, en partie d'exercice).
   Styles : pile/pile.css. Glisser-déposer : assets/dragdrop.js (à charger avant).

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
  // COULEUR COMMUNE e- et I (figure)
  // =============================================
  const EI_COLOR = '#2563eb';   // bleu unique pour e- et I

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
    const titreBloc = t => `<div class="pile-bloc-t">${t}</div>`;
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
            <span><strong>Schéma de la pile :</strong> glisse les entités chimiques (métaux, ions, polarités, sens des électrons et du courant, ions du pont salin…) aux bons emplacements sur le schéma.</span></li>
          <li><span class="pile-num">2</span>
            <span><strong>Demi-piles :</strong> dépose la demi-équation dans chaque demi-pile, puis utilise le bouton <span class="pile-ex-flip">⇌</span> pour l'orienter dans le <strong class="pile-acc">bon sens de fonctionnement</strong>. Indique aussi le type de réaction et le nom de l'électrode.</span></li>
          <li><span class="pile-num">3</span>
            <span><strong>Équation de fonctionnement :</strong> construis l'équation de la pile en glissant les espèces chimiques dans les zones Réactifs et Produits. Vérifie qu'elle est bien <strong class="pile-acc">équilibrée</strong> (ajuste les nombres stœchiométriques avec les flèches ▲ et ▼).</span></li>
          <li><span class="pile-num">4</span>
            <span><strong>Vérification :</strong> tu peux vérifier, corriger tes réponses et vérifier encore autant de fois que tu veux. ${enPartie ? 'Tout juste à la première vérification : 2 points ; sinon : 1 point ; correction affichée : 0 point.' : 'Si tout est juste dès la première vérification, tu gagnes 2 points. Sinon, tu gagnes 1 point. Si tu affiches la réponse, tu ne gagnes pas de point.'}</span></li>
        </ul>
      </div>

      <!-- DATA -->
      <div class="pile-donnees">
        <div class="pile-donnees-t">Données</div>
        <div id="${P}data-wrap" class="pile-donnees-c"></div>
      </div>

      <!-- PILE SCHEMA (banque intégrée dedans) -->
      <div class="pile-bloc">
        ${titreBloc('Schéma de la pile')}
        <div class="pile-banque">
          ${sousTitre('Glisser sur le schéma')}
          <div id="${P}bank-schema" class="pile-banque-l"></div>
        </div>
        <div id="${P}schema-wrap" class="pile-defile"></div>
      </div>

      <!-- BOUTON VÉRIFICATION SCHÉMA + résultat -->
      <div class="pile-actions">
        <button type="button" class="btn-secondary" data-act="checkSchema">Vérifier le schéma</button>
      </div>
      <div id="${P}hints-schema" class="pile-retour"></div>

      <!-- LOWER ZONES (banque intégrée dedans) -->
      <div class="pile-bloc">
        ${titreBloc('Demi-piles')}
        <div class="pile-banque">
          ${sousTitre('Glisser sous les demi-piles')}
          <div id="${P}bank-lower" class="pile-banque-l"></div>
        </div>
        <div id="${P}lower-wrap"></div>
      </div>

      <!-- BOUTON VÉRIFICATION DEMI-PILES + résultat -->
      <div class="pile-actions">
        <button type="button" class="btn-secondary" data-act="checkDemiPiles">Vérification des demi-piles</button>
      </div>
      <div id="${P}hints-demipiles" class="pile-retour"></div>

      <!-- EQUATION (banque d'espèces intégrée dedans) -->
      <div class="pile-bloc">
        ${titreBloc('Équation de fonctionnement de la pile')}
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
      window.DragDrop.enable(el, {
        zoneSelector: '.dz, .heq-dz, .eq-side',
        dragOverClass: 'over',
        onStart: () => { dragging = data; },
        onDrop: (item, zone) => {
          if (zone && !locked) {
            const handler = dropzoneRegistry.get(zone);
            if (handler && dragging && handler.accept(dragging)) {
              handler.onDrop(dragging);
            }
          }
          dragging = null;
        },
      });
    }

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
    // SCHEMA SVG
    // =============================================
    function renderSchema() {
      const W = 660, H = 360;

      const BW = 160, BH = 145;
      const BYtop = 140;
      const LBX = 50;
      const RBX = W - LBX - BW;
      const LBcx = LBX + BW/2;
      const RBcx = RBX + BW/2;

      const EW = 16, EH = 105;
      const EYtop = BYtop - 35;
      const LEX = LBcx - EW/2;
      const REX = RBcx - EW/2;

      const WireY = 52;
      const MX = W/2, MY = WireY, MR = 28;

      // Pont salin
      const BridgeInset = 20;
      const BridgeY = BYtop - 3;
      const PontMid = (LBX + BW - BridgeInset + RBX + BridgeInset) / 2;
      const BridgeDescend = 36;

      // Positions des flèches sur le pont salin
      const CatArrowX = PontMid + 40;
      const AnArrowX  = PontMid - 40;

      const anodeSide = Q.anodeSide;

      const LeftWireMid  = LBcx + (MX - MR - LBcx) / 2;
      const RightWireMid = (MX + MR + RBcx) / 2;

      let eArrowZoneX, iArrowZoneX;
      let eArrow_x1, eArrow_x2, iArrow_x1, iArrow_x2;

      if (anodeSide === 'L') {
        eArrowZoneX = LeftWireMid;
        eArrow_x1 = LeftWireMid - 12;
        eArrow_x2 = LeftWireMid + 1;
        iArrowZoneX = RightWireMid;
        iArrow_x1 = RightWireMid + 12;
        iArrow_x2 = RightWireMid - 1;
      } else {
        eArrowZoneX = RightWireMid;
        eArrow_x1 = RightWireMid + 12;
        eArrow_x2 = RightWireMid - 1;
        iArrowZoneX = LeftWireMid;
        iArrow_x1 = LeftWireMid - 12;
        iArrow_x2 = LeftWireMid + 1;
      }

      let catX1, catX2, anX1, anX2;
      if (anodeSide === 'L') {
        catX1 = CatArrowX - 1; catX2 = CatArrowX;
        anX1 = AnArrowX + 1;   anX2 = AnArrowX;
      } else {
        catX1 = AnArrowX + 1; catX2 = AnArrowX;
        anX1 = CatArrowX - 1; anX2 = CatArrowX;
      }

      const PONTCOLOR = '#0d9488';
      const LBColor = '#e0f2fe', LBStroke = '#0284c7';
      const RBColor = '#fef3c7', RBStroke = '#d97706';

      // Couleur unique bleue pour e- et I
      const EI_COL = EI_COLOR;

      const svg = `<svg width="${W}" height="${H}" style="display:block;margin:0 auto;overflow:visible;" role="img" aria-label="Schéma d'une pile : deux demi-piles reliées par un pont salin et par un circuit extérieur avec un ${Q.appareil === 'A' ? 'ampèremètre' : 'voltmètre'}">
      <defs>
        <marker id="${P}arr-e" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="${EI_COL}"/>
        </marker>
        <marker id="${P}arr-i" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="${EI_COL}"/>
        </marker>
        <marker id="${P}arr-cat" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="${PONTCOLOR}"/>
        </marker>
        <marker id="${P}arr-an" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="${PONTCOLOR}"/>
        </marker>
      </defs>

      <!-- Bécher gauche -->
      <rect x="${LBX}" y="${BYtop}" width="${BW}" height="${BH}" rx="4" fill="${LBColor}" stroke="${LBStroke}" stroke-width="2"/>
      <!-- Bécher droit -->
      <rect x="${RBX}" y="${BYtop}" width="${BW}" height="${BH}" rx="4" fill="${RBColor}" stroke="${RBStroke}" stroke-width="2"/>

      <!-- Électrode gauche -->
      <rect x="${LEX}" y="${EYtop}" width="${EW}" height="${EH}" rx="3" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
      <!-- Électrode droite -->
      <rect x="${REX}" y="${EYtop}" width="${EW}" height="${EH}" rx="3" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

      <!-- Circuit extérieur : fils -->
      <line x1="${LBcx}" y1="${EYtop}" x2="${LBcx}" y2="${WireY}" stroke="#1e293b" stroke-width="2.5"/>
      <line x1="${LBcx}" y1="${WireY}" x2="${MX-MR}" y2="${WireY}" stroke="#1e293b" stroke-width="2.5"/>
      <line x1="${MX+MR}" y1="${WireY}" x2="${RBcx}" y2="${WireY}" stroke="#1e293b" stroke-width="2.5"/>
      <line x1="${RBcx}" y1="${WireY}" x2="${RBcx}" y2="${EYtop}" stroke="#1e293b" stroke-width="2.5"/>

      <!-- Appareil de mesure (fixe) : voltmètre, ou ampèremètre dans un exercice -->
      <circle cx="${MX}" cy="${MY}" r="${MR}" fill="white" stroke="#1e293b" stroke-width="2.5"/>
      <text x="${MX}" y="${MY+7}" text-anchor="middle" font-size="19" font-weight="900" fill="#1e293b">${Q.appareil || 'V'}</text>

      <!-- Flèche e- (bleu) -->
      <line x1="${eArrow_x1}" y1="${WireY}" x2="${eArrow_x2}" y2="${WireY}" stroke="${EI_COL}" stroke-width="2.5" marker-end="url(#${P}arr-e)"/>

      <!-- Flèche I (bleu, même couleur que e-) -->
      <line x1="${iArrow_x1}" y1="${WireY}" x2="${iArrow_x2}" y2="${WireY}" stroke="${EI_COL}" stroke-width="2.5" marker-end="url(#${P}arr-i)"/>

      <!-- Pont salin -->
      <line x1="${LBX+BW-BridgeInset}" y1="${BridgeY}" x2="${LBX+BW-BridgeInset}" y2="${BridgeY+BridgeDescend}" stroke="${PONTCOLOR}" stroke-width="3"/>
      <line x1="${LBX+BW-BridgeInset}" y1="${BridgeY}" x2="${RBX+BridgeInset}" y2="${BridgeY}" stroke="${PONTCOLOR}" stroke-width="3"/>
      <line x1="${RBX+BridgeInset}" y1="${BridgeY}" x2="${RBX+BridgeInset}" y2="${BridgeY+BridgeDescend}" stroke="${PONTCOLOR}" stroke-width="3"/>

      <!-- Label "pont salin" -->
      <text x="${PontMid}" y="${BridgeY + BridgeDescend + 12}" text-anchor="middle" font-size="10" fill="${PONTCOLOR}" font-style="italic" font-weight="700">pont salin</text>

      <!-- Flèche cation sur pont salin -->
      <line x1="${catX1}" y1="${BridgeY}" x2="${catX2}" y2="${BridgeY}" stroke="${PONTCOLOR}" stroke-width="2" marker-end="url(#${P}arr-cat)"/>
      <!-- Flèche anion sur pont salin -->
      <line x1="${anX1}" y1="${BridgeY}" x2="${anX2}" y2="${BridgeY}" stroke="${PONTCOLOR}" stroke-width="2" marker-end="url(#${P}arr-an)"/>

      <!-- Labels demi-piles -->
      <text x="${LBcx}" y="${BYtop + BH + 18}" text-anchor="middle" font-size="12" fill="${LBStroke}" font-weight="700">Demi-pile gauche</text>
      <text x="${RBcx}" y="${BYtop + BH + 18}" text-anchor="middle" font-size="12" fill="${RBStroke}" font-weight="700">Demi-pile droite</text>
      </svg>`;

      const wrap = $('schema-wrap');
      wrap.style.position = 'relative';
      wrap.innerHTML = `<div style="position:relative;width:${W}px;height:${H+10}px;margin:0 auto;">` + svg + `</div>`;

      const container = wrap.querySelector('div');

      function addDZ(id, style, content='') {
        const d = document.createElement('div');
        d.id = P + id;
        d.className = 'dz';
        d.style.cssText = `position:absolute;${style}`;
        d.innerHTML = content;
        container.appendChild(d);
        return d;
      }

      // COM LEFT / RIGHT
      addDZ('dz-com-left',  `left:${MX-MR-52}px;top:${MY-12}px;width:46px;height:24px;font-size:10px;`);
      addDZ('dz-com-right', `left:${MX+MR+6}px;top:${MY-12}px;width:46px;height:24px;font-size:10px;`);

      // ELECTRONS zone — couleur bleue commune
      {
        const ex = eArrowZoneX;
        const dze = addDZ('dz-electrons', `left:${ex-28}px;top:${WireY-36}px;width:56px;height:22px;font-size:12px;`);
        dze.style.borderColor = EI_COLOR;
        dze.style.background = '#eff6ff';
        dze.style.color = EI_COLOR;
      }

      // CURRENT zone — même couleur bleue
      {
        const ix = iArrowZoneX;
        const dzi = addDZ('dz-current', `left:${ix-28}px;top:${WireY-36}px;width:56px;height:22px;font-size:12px;`);
        dzi.style.borderColor = EI_COLOR;
        dzi.style.background = '#eff6ff';
        dzi.style.color = EI_COLOR;
      }

      // POLARITY
      addDZ('dz-pol-l', `left:${LBcx-38}px;top:${EYtop-26}px;width:28px;height:28px;border-radius:50%;font-size:16px;`);
      addDZ('dz-pol-r', `left:${RBcx+10}px;top:${EYtop-26}px;width:28px;height:28px;border-radius:50%;font-size:16px;`);

      // METAL / ION LEFT
      addDZ('dz-metal-l', `left:${LBX+8}px;top:${BYtop+8}px;width:44px;height:26px;font-size:13px;`);
      addDZ('dz-ion-l',   `left:${LBX+8}px;top:${BYtop+105}px;width:52px;height:26px;font-size:12px;`);

      // METAL / ION RIGHT
      addDZ('dz-metal-r', `left:${RBX+BW-56}px;top:${BYtop+8}px;width:44px;height:26px;font-size:13px;`);
      addDZ('dz-ion-r',   `left:${RBX+BW-60}px;top:${BYtop+105}px;width:52px;height:26px;font-size:12px;`);

      // ZONES PONT SALIN
      {
        const leftPontX  = Math.min(CatArrowX, AnArrowX);
        const rightPontX = Math.max(CatArrowX, AnArrowX);
        const dz1 = addDZ('dz-pont-left',  `left:${leftPontX-36}px;top:${BridgeY-42}px;width:72px;height:22px;font-size:10px;`);
        dz1.style.borderColor = PONTCOLOR; dz1.style.background = '#f0fdfa'; dz1.style.color = '#0f766e';
        const dz2 = addDZ('dz-pont-right', `left:${rightPontX-36}px;top:${BridgeY-42}px;width:72px;height:22px;font-size:10px;`);
        dz2.style.borderColor = PONTCOLOR; dz2.style.background = '#f0fdfa'; dz2.style.color = '#0f766e';
      }

      setupSchemaZones();
      applyGiven();
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
          el.innerHTML = makeContent(d);
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
          comLEl.innerHTML = `<span style="font-size:10px;font-weight:700;">COM</span>`;
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
          comREl.innerHTML = `<span style="font-size:10px;font-weight:700;">COM</span>`;
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
            ? `<span style="font-weight:700;color:${EI_COLOR};">e⁻</span>`
            : `<span style="font-weight:700;color:${EI_COLOR};">I</span>`;
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
        d => `<span style="font-size:16px;font-weight:900;">${d.label}</span>`, polNeed);
      simpleZone('dz-pol-r','pol_r',['d-plus','d-minus'],
        d => `<span style="font-size:16px;font-weight:900;">${d.label}</span>`, polNeed);

      // METAL / ION
      const allMIds = ['ml-'+leftCouple.id, 'ml-'+rightCouple.id];
      const allIIds = ['il-'+leftCouple.id, 'il-'+rightCouple.id];

      simpleZone('dz-metal-l','metal_l', allMIds,
        d => `<span style="font-size:13px;font-weight:700;">${d.label}</span>`, !gML);
      simpleZone('dz-ion-l','ion_l', allIIds,
        d => `<span style="font-size:12px;font-weight:700;">${d.labelH}</span>`, !gIL);
      simpleZone('dz-metal-r','metal_r', allMIds,
        d => `<span style="font-size:13px;font-weight:700;">${d.label}</span>`, !gMR);
      simpleZone('dz-ion-r','ion_r', allIIds,
        d => `<span style="font-size:12px;font-weight:700;">${d.labelH}</span>`, !gIR);

      // PONT SALIN
      const pontAccept = ['d-cat','d-an'];
      function setupPontZone(dzId, fkey) {
        const el = dz(dzId);
        if (!el) return;
        makeDropzone(el, d => pontAccept.includes(d.id), d => {
          if (el.dataset.dragId) unmarkUsed(el.dataset.dragId);
          const lbl = d.id === 'd-cat' ? 'cation +' : 'anion −';
          el.innerHTML = `<span style="font-size:10px;font-weight:700;">${lbl}</span>`;
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
        el.innerHTML = html;
        el.classList.add('given');
        el.dataset.given = '1';
        el.dataset.filled = '1';
        if (fkey) F[fkey] = fval;
      }

      if (hint === 'electrons') {
        setGiven('dz-electrons',`<span style="font-weight:700;color:${EI_COLOR};">e⁻</span>`,'electrons','d-e');
      }
      if (hint === 'current') {
        setGiven('dz-current',`<span style="font-weight:700;color:${EI_COLOR};">I</span>`,'current','d-i');
      }
      if (hint === 'polarity') {
        const minusSide = anodeSide === 'L' ? 'l' : 'r';
        const plusSide  = anodeSide === 'L' ? 'r' : 'l';
        setGiven(`dz-pol-${minusSide}`,'<span style="font-size:16px;font-weight:900;">−</span>',`pol_${minusSide}`,'d-minus');
        setGiven(`dz-pol-${plusSide}`, '<span style="font-size:16px;font-weight:900;">+</span>', `pol_${plusSide}`,'d-plus');
      }
      if (hint === 'meter') {
        const comSide = anodeSide === 'L' ? 'left' : 'right';
        const otherSide = anodeSide === 'L' ? 'right' : 'left';
        const comVal = anodeSide === 'L' ? 'L' : 'R';
        setGiven(`dz-com-${comSide}`,'<span style="font-size:10px;font-weight:700;">COM</span>','com', comVal);
        const otherEl = $(`dz-com-${otherSide}`);
        if (otherEl) { otherEl.innerHTML=''; otherEl.dataset.given='1'; }
      }

      if (gML) setGiven('dz-metal-l',`<span style="font-size:13px;font-weight:700;">${leftCouple.metal}</span>`,'metal_l','ml-'+leftCouple.id);
      if (gIL) setGiven('dz-ion-l',`<span style="font-size:12px;font-weight:700;">${leftCouple.ionH}</span>`,'ion_l','il-'+leftCouple.id);
      if (gMR) setGiven('dz-metal-r',`<span style="font-size:13px;font-weight:700;">${rightCouple.metal}</span>`,'metal_r','ml-'+rightCouple.id);
      if (gIR) setGiven('dz-ion-r',`<span style="font-size:12px;font-weight:700;">${rightCouple.ionH}</span>`,'ion_r','il-'+rightCouple.id);
    }

    // =============================================
    // BANK SCHEMA
    // =============================================
    function renderBankSchema() {
      const { hint, gML, gIL, gMR, gIR, leftCouple, rightCouple } = Q;
      const bank = $('bank-schema');

      const items = [];

      if (hint !== 'meter') {
        items.push({ id:'com', label:'COM', bg:'#475569', title:'Borne COM' });
      }
      // e- et I en bleu commun
      if (hint !== 'electrons') items.push({ id:'d-e', label:'e⁻', bg: EI_COLOR, title:'Sens des électrons' });
      if (hint !== 'current')   items.push({ id:'d-i', label:'I',  bg: EI_COLOR, title:'Sens du courant' });
      if (hint !== 'polarity') {
        items.push({ id:'d-plus',  label:'+', bg:'#b45309', title:'Borne positive' });
        items.push({ id:'d-minus', label:'−', bg:'#7c3aed', title:'Borne négative' });
      }

      items.push({ id:'d-cat', label:'cation +', bg:'#0d9488', title:'Cation (pont salin)' });
      items.push({ id:'d-an',  label:'anion −',  bg:'#0d9488', title:'Anion (pont salin)' });

      if (!gML) items.push({ id:'ml-'+leftCouple.id,  label: leftCouple.metal,  labelH: leftCouple.metal,  bg:'#065f46', title:'Métal gauche' });
      if (!gIL) items.push({ id:'il-'+leftCouple.id,  label: leftCouple.ion,    labelH: leftCouple.ionH,   bg:'#065f46', title:'Ion gauche' });
      if (!gMR) items.push({ id:'ml-'+rightCouple.id, label: rightCouple.metal, labelH: rightCouple.metal, bg:'#065f46', title:'Métal droit' });
      if (!gIR) items.push({ id:'il-'+rightCouple.id, label: rightCouple.ion,   labelH: rightCouple.ionH,  bg:'#065f46', title:'Ion droit' });

      bank.innerHTML = items.map(item => `
        <div class="drag-item" data-id="${item.id}"
             style="background:${item.bg || 'var(--accent-ink)'};${(item.id==='d-plus'||item.id==='d-minus')?'font-size:17px;':''}"
             title="${item.title || ''}">
          ${item.labelH || item.label}
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
        items.push({ id:'heq-anode',   labelH: anode.eqStdH,   bg:'#0c4a6e', title:'Demi-équation anode',   type:'heq', couple: anode });
        items.push({ id:'heq-cathode', labelH: cathode.eqStdH, bg:'#0c4a6e', title:'Demi-équation cathode', type:'heq', couple: cathode });
      }

      items.push({ id:'d-ox',     label:'Oxydation', bg:'#7c3aed', title:'Oxydation' });
      items.push({ id:'d-red',    label:'Réduction', bg:'#7c3aed', title:'Réduction' });
      items.push({ id:'d-anode',  label:'Anode',     bg:'#92400e', title:'Anode' });
      items.push({ id:'d-cathode',label:'Cathode',   bg:'#92400e', title:'Cathode' });

      bank.innerHTML = items.map(item => `
        <div class="drag-item" data-id="${item.id}"
             style="background:${item.bg || 'var(--accent-ink)'};${item.type==='heq'?'font-size:12px;':''}"
             title="${item.title || ''}">
          ${item.labelH || item.label}
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
        <div>
          <div class="pile-demi-t">Demi-pile ${nom}</div>
          <div style="margin-bottom:10px;">
            <div class="pile-zone-t">Demi-équation</div>
            <div id="${P}dz-heq-${cote}" class="heq-dz"><span class="pile-ph">${PH_HEQ}</span></div>
          </div>
          <div style="margin-bottom:10px;">
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
      setupSimpleLowerZone('dz-oxred-l','oxred_l',['d-ox','d-red'], d=>`<span style="font-size:13px;font-weight:700;">${d.label}</span>`);
      setupSimpleLowerZone('dz-oxred-r','oxred_r',['d-ox','d-red'], d=>`<span style="font-size:13px;font-weight:700;">${d.label}</span>`);
      setupSimpleLowerZone('dz-elec-l','elec_l',['d-anode','d-cathode'], d=>`<span style="font-size:13px;font-weight:700;">${d.label}</span>`);
      setupSimpleLowerZone('dz-elec-r','elec_r',['d-anode','d-cathode'], d=>`<span style="font-size:13px;font-weight:700;">${d.label}</span>`);

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
        <span id="${P}heq-txt-${side}" style="flex:1;font-size:13px;font-weight:600;">${eqH}</span>
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
      el.innerHTML = `<span style="font-size:13px;font-weight:600;color:var(--ink);">${eqH}</span>`;
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
        el.innerHTML = mkHtml(d);
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
          ${sousTitre('Glisser dans l\'équation')}
          <div class="pile-banque-l">
            ${allSp.map(s=>`<div class="drag-item" data-id="${s.id}" data-type="sp" style="background:var(--accent);font-size:13px;" title="${s.label}">${s.html}</div>`).join('')}
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
          <span style="margin:0 4px;">${sp.html}</span>
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
        el.innerHTML = html;
        el.classList.remove('incorrect');
        el.classList.add('filled','correct');
        el.dataset.filled = '1';
        if (fkey) F[fkey] = fval;
      }

      if (hint !== 'electrons') force('dz-electrons',`<span style="font-weight:700;color:${EI_COLOR};">e⁻</span>`,'electrons','d-e');
      if (hint !== 'current')   force('dz-current',  `<span style="font-weight:700;color:${EI_COLOR};">I</span>`,'current','d-i');

      if (hint !== 'meter') {
        const comSide   = anodeSide === 'L' ? 'left' : 'right';
        const otherSide = anodeSide === 'L' ? 'right' : 'left';
        const comVal    = anodeSide === 'L' ? 'L' : 'R';
        force(`dz-com-${comSide}`,'<span style="font-size:10px;font-weight:700;">COM</span>','com', comVal);
        const otherEl = $(`dz-com-${otherSide}`);
        if (otherEl && !otherEl.dataset.given) { otherEl.innerHTML=''; otherEl.classList.remove('filled','correct','incorrect'); }
      }

      if (hint !== 'polarity') {
        const minusSide = anodeSide === 'L' ? 'l' : 'r';
        const plusSide  = anodeSide === 'L' ? 'r' : 'l';
        force(`dz-pol-${minusSide}`,'<span style="font-size:16px;font-weight:900;">−</span>',`pol_${minusSide}`,'d-minus');
        force(`dz-pol-${plusSide}`, '<span style="font-size:16px;font-weight:900;">+</span>', `pol_${plusSide}`,'d-plus');
      }

      const catZone = anodeSide === 'L' ? 'dz-pont-right' : 'dz-pont-left';
      const anZone  = anodeSide === 'L' ? 'dz-pont-left'  : 'dz-pont-right';
      const catFkey = catZone === 'dz-pont-right' ? 'pont_right' : 'pont_left';
      const anFkey  = anZone  === 'dz-pont-right' ? 'pont_right' : 'pont_left';
      force(catZone,'<span style="font-size:10px;font-weight:700;">cation +</span>',catFkey,'d-cat');
      force(anZone, '<span style="font-size:10px;font-weight:700;">anion −</span>', anFkey, 'd-an');

      if (!Q.gML) force('dz-metal-l',`<span style="font-size:13px;font-weight:700;">${leftCouple.metal}</span>`,'metal_l','ml-'+leftCouple.id);
      if (!Q.gIL) force('dz-ion-l',  `<span style="font-size:12px;font-weight:700;">${leftCouple.ionH}</span>`,'ion_l','il-'+leftCouple.id);
      if (!Q.gMR) force('dz-metal-r',`<span style="font-size:13px;font-weight:700;">${rightCouple.metal}</span>`,'metal_r','ml-'+rightCouple.id);
      if (!Q.gIR) force('dz-ion-r',  `<span style="font-size:12px;font-weight:700;">${rightCouple.ionH}</span>`,'ion_r','il-'+rightCouple.id);

      if (hint !== 'half_eqs_placed') {
        ['l','r'].forEach(side => {
          const el = $('dz-heq-'+side);
          if (!el || el.dataset.given) return;
          const couple = side === 'l' ? leftCouple : rightCouple;
          const dir = (side === 'l') ? (anodeSide === 'L' ? 'ox' : 'red') : (anodeSide === 'L' ? 'red' : 'ox');
          const eqH = dir === 'ox' ? couple.eqOxH : couple.eqRedH;
          el.innerHTML = `<span style="font-size:13px;font-weight:600;">${eqH}</span>`;
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

      force('dz-oxred-l',`<span style="font-size:13px;font-weight:700;">${oxredLCorrect}</span>`,'oxred_l',oxredLFval);
      force('dz-oxred-r',`<span style="font-size:13px;font-weight:700;">${oxredRCorrect}</span>`,'oxred_r',oxredRFval);
      force('dz-elec-l', `<span style="font-size:13px;font-weight:700;">${elecLLabel}</span>`,   'elec_l', elecLFval);
      force('dz-elec-r', `<span style="font-size:13px;font-weight:700;">${elecRLabel}</span>`,   'elec_r', elecRFval);

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
