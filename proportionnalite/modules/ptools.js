/* ============================================================
   Outils communs à l'application "Proportionnalité" (partagés par
   les modules de cours, de vérification des connaissances et
   d'entraînement de ce dossier uniquement — pas mutualisés avec
   les autres applications).

   Fournit :
   - l'en-tête de quiz (badge, titre, barre de progression, score)
   - l'écran de fin (score, détail, confettis si sans-faute)
   - un moteur de glisser-déposer "étiquette → case" à repositionnement
     libre : les étiquettes peuvent être déplacées dans n'importe
     quelle case (ou remises dans la palette), la correction ne se
     déclenche qu'au clic sur "Vérifier". Quand les deux étiquettes
     d'un calcul (division) sont posées, le résultat est calculé et
     affiché automatiquement, en direct.
   - un générateur de petits graphiques SVG (droites, points A/B)
   - deux schémas illustratifs (tableau de proportionnalité directe
     / inverse) pour le cours
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Formatage des nombres ---------- */
  function ptFmt(x, decimals) {
    if (decimals === undefined) decimals = 2;
    let v = Math.round(x * Math.pow(10, decimals)) / Math.pow(10, decimals);
    let s = v.toFixed(decimals);
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s.replace('.', ',');
  }

  /* ---------- En-tête de quiz ---------- */
  function ptHeader(opts) {
    const pct = Math.round((opts.idx / opts.total) * 100);
    return `
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <span class="content-module-badge">${opts.badge}</span>
        <h2 class="text-2xl font-bold text-[var(--app-accent-800)] mb-1">${opts.title}</h2>
        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Question ${opts.idx + 1}/${opts.total} &middot; Score : <span class="score-badge">${opts.score} pt${opts.score > 1 ? 's' : ''}</span></p>
        <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
      </div>`;
  }

  /* Bouton "Passer" commun (permet de passer une question sans répondre) */
  function ptSkipBtn(fn) {
    return `<button type="button" class="btn-skip" onclick="${fn}">Passer →</button>`;
  }

  /* ---------- Écran de fin ---------- */
  function ptFinish(opts) {
    const pct = Math.round((opts.score / opts.max) * 100);
    const isMax = opts.score >= (opts.trueMax !== undefined ? opts.trueMax : opts.max);
    const recapHtml = (opts.recap || []).map(a =>
      `<div class="recap-item">Q${a.num}<br><b>${a.pts}/${a.max}</b></div>`).join('');
    const nextHtml = opts.nextHref
      ? `<a href="${opts.nextHref}" class="btn-primary inline-block no-underline ml-2">${opts.nextLabel || 'Suite →'}</a>` : '';
    setTimeout(() => { if (isMax) ptConfetti(); }, 50);
    return `
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 class="text-2xl font-bold text-[var(--app-accent-800)] mb-2">${opts.title || 'Terminé !'}</h2>
        ${isMax ? `<p class="text-lg font-bold text-amber-600 mb-2">🏆 Score maximal ! Sans-faute !</p>` : ''}
        <p class="text-lg text-gray-700 mb-4">Score : ${opts.score} / ${opts.max} points (${pct}%)</p>
        <button onclick="${opts.restartFn}" class="btn-primary">↺ Recommencer</button>
        ${nextHtml}
        ${recapHtml ? `<div class="text-sm font-bold text-gray-500 mt-6 mb-2 text-left">Détail des points</div>
        <div class="recap-grid">${recapHtml}</div>` : ''}
      </div>`;
  }

  let confettiInterval = null;
  function ptConfetti() {
    if (confettiInterval) return;
    const colors = ['#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];
    function burst() {
      for (let i = 0; i < 24; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = (Math.random() * 100) + 'vw';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = (2.5 + Math.random() * 1.5) + 's';
        el.style.animationDelay = (Math.random() * 0.4) + 's';
        el.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }
    }
    burst();
    confettiInterval = setInterval(burst, 700);
    setTimeout(() => { clearInterval(confettiInterval); confettiInterval = null; }, 2200);
  }

  /* ---------- Étiquettes / cases à glisser-déposer (repositionnement libre) ----------
     ptChip(id, label, value) : étiquette. value est un nombre, utilisé
       pour le calcul automatique en direct quand la case fait partie
       d'un groupe "live".
     ptSlot(accept) : case attendant l'étiquette d'id `accept`.

     ptSlotEngine(root, config) crée le comportement :
     - une étiquette peut être déposée dans n'importe quelle case (elle
       en évince alors l'occupante, qui retourne dans la palette), ou
       ramenée dans la palette (élément .pt-palette).
     - aucune couleur n'apparaît au dépôt : la correction n'est calculée
       qu'à l'appel de engine.verify().
     - config.liveGroups: [{ slots:['id1','id2'], op:'div'|'mul',
       target:'#selecteur', decimals, suffix }] : quand les deux cases
       du groupe sont remplies, affiche automatiquement value(slot1)
       [op] value(slot2) dans l'élément cible (mis à jour à chaque
       changement). */
  function ptSlotEngine(root, config) {
    config = config || {};

    function wireChip(chip) {
      if (chip.dataset.wired === '1') return;
      chip.dataset.wired = '1';
      DragDrop.enable(chip, {
        zoneSelector: '.pt-slot, .pt-palette',
        dragOverClass: 'pt-slot-over',
        onDrop: (item, zone) => {
          if (!zone || !root.contains(zone)) return;
          const oldParent = item.parentElement;
          if (zone === oldParent) return;
          if (zone.classList.contains('pt-slot')) {
            const existing = zone.querySelector('.pt-chip');
            if (existing && existing !== item) {
              const palette = root.querySelector('.pt-palette');
              if (palette) palette.appendChild(existing);
            }
            const ph = zone.querySelector('.pt-slot-ph');
            if (ph) ph.remove();
          }
          zone.appendChild(item);
          if (oldParent && oldParent.classList.contains('pt-slot') && !oldParent.querySelector('.pt-chip') && !oldParent.querySelector('.pt-slot-ph')) {
            oldParent.insertAdjacentHTML('afterbegin', '<span class="pt-slot-ph">?</span>');
          }
          clearVerifyStyles();
          updateLive();
          if (config.onChange) config.onChange();
        },
      });
    }

    function clearVerifyStyles() {
      root.querySelectorAll('.pt-slot').forEach(s => s.classList.remove('pt-slot-ok', 'pt-slot-bad'));
    }

    function updateLive() {
      (config.liveGroups || []).forEach(g => {
        const slots = g.slots.map(id => root.querySelector(`.pt-slot[data-accept="${id}"]`));
        const chips = slots.map(s => s && s.querySelector('.pt-chip'));
        const target = root.querySelector(g.target);
        if (!target) return;
        if (chips.every(c => c)) {
          const vals = chips.map(c => parseFloat(c.dataset.value));
          const result = g.op === 'mul' ? vals[0] * vals[1] : vals[0] / vals[1];
          let unitStr = (g.suffix || '').trim();
          if (g.dynamicUnit) {
            const uNum = chips[0].dataset.unit, uDen = chips[1].dataset.unit;
            unitStr = uNum && uDen ? (uNum + '/' + uDen) : (uNum || uDen || '');
          }
          target.textContent = ptFmt(result, g.decimals === undefined ? 3 : g.decimals) + (unitStr ? ' ' + unitStr : '');
          target.classList.add('pt-live-filled');
        } else {
          target.textContent = '?';
          target.classList.remove('pt-live-filled');
        }
      });
    }

    function verify() {
      let correct = 0, total = 0;
      root.querySelectorAll('.pt-slot[data-accept]').forEach(slot => {
        total++;
        const chip = slot.querySelector('.pt-chip');
        const acceptable = slot.dataset.accept.split(',');
        const ok = !!(chip && acceptable.includes(chip.dataset.chipId));
        slot.classList.toggle('pt-slot-ok', ok);
        slot.classList.toggle('pt-slot-bad', !ok);
        if (ok) correct++;
      });
      return { correct, total };
    }

    if (window.DragDrop) DragDrop.cleanupGhosts();
    root.querySelectorAll('.pt-chip').forEach(wireChip);
    updateLive();
    return { verify: verify, updateLive: updateLive };
  }

  function ptChip(id, label, value, unit) {
    const v = value === undefined ? '' : value;
    const u = unit === undefined ? '' : unit;
    return `<button type="button" class="pt-chip" data-chip-id="${id}" data-value="${v}" data-unit="${u}">${label}</button>`;
  }
  function ptSlot(accept) {
    const acceptStr = Array.isArray(accept) ? accept.join(',') : accept;
    return `<span class="pt-slot" data-accept="${acceptStr}"><span class="pt-slot-ph">?</span></span>`;
  }
  /* Fraction glisser-déposer : case numérateur / case dénominateur,
     avec le résultat calculé et affiché en direct (id = liveId). L'unité
     n'est pas fixée à l'avance : elle est déduite automatiquement des
     étiquettes réellement posées (voir ptSlotEngine, liveGroups.dynamicUnit). */
  function ptFraction(numAccept, denAccept, liveId) {
    return `<span class="pt-frac">
        <span class="pt-frac-num">${ptSlot(numAccept)}</span>
        <span class="pt-frac-line"></span>
        <span class="pt-frac-den">${ptSlot(denAccept)}</span>
      </span>
      <span class="pt-frac-eq">= <span id="${liveId}" class="pt-live">?</span></span>`;
  }

  /* ---------- Petit graphique SVG (droite + 2 points repérés) ----------
     opts: { xMax, yMax, xMin, yMin (def. 0 : mettre >0 pour ne pas
     montrer l'origine), xLabel, yLabel, k, intercept, curved, curveFn,
     pointA:[x,y], pointB:[x,y], showPoints, nx, ny (nb de graduations) }
     La droite est toujours tracée avec la vraie pente k, rognée aux
     bords visibles (jamais déformée même si xMin/yMin > 0). */
  function ptGraphSvg(opts) {
    const W = 300, H = 230, padL = 46, padB = 34, padT = 14, padR = 14;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const xMax = opts.xMax, yMax = opts.yMax;
    const xMin = opts.xMin || 0, yMin = opts.yMin || 0;
    const nx = opts.nx || 4, ny = opts.ny || 4;
    const sx = x => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const sy = y => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    let gridLines = '';
    for (let i = 0; i <= nx; i++) {
      const x = xMin + ((xMax - xMin) / nx) * i;
      gridLines += `<line x1="${sx(x)}" y1="${padT}" x2="${sx(x)}" y2="${padT + plotH}" stroke="#e2e8f0" stroke-width="1"/>`;
      gridLines += `<text x="${sx(x)}" y="${padT + plotH + 16}" font-size="9" fill="#64748b" text-anchor="middle">${ptFmt(x, 2)}</text>`;
    }
    for (let i = 0; i <= ny; i++) {
      const y = yMin + ((yMax - yMin) / ny) * i;
      gridLines += `<line x1="${padL}" y1="${sy(y)}" x2="${padL + plotW}" y2="${sy(y)}" stroke="#e2e8f0" stroke-width="1"/>`;
      gridLines += `<text x="${padL - 6}" y="${sy(y) + 3}" font-size="9" fill="#64748b" text-anchor="end">${ptFmt(y, 2)}</text>`;
    }

    let curve = '';
    if (opts.curved) {
      let d = '';
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const x = xMin + ((xMax - xMin) * i) / n;
        const y = opts.curveFn(x);
        d += (i === 0 ? 'M' : 'L') + sx(x) + ',' + sy(Math.min(y, yMax));
      }
      curve = `<path d="${d}" fill="none" stroke="#7c3aed" stroke-width="2.5"/>`;
    } else {
      const b = opts.intercept || 0;
      const yAt = x => opts.k * x + b;
      const xAt = y => (y - b) / opts.k;
      let x0 = xMin, x1 = xMax;
      if (opts.k !== 0) {
        if (yAt(x0) < yMin) x0 = xAt(yMin); else if (yAt(x0) > yMax) x0 = xAt(yMax);
        if (yAt(x1) < yMin) x1 = xAt(yMin); else if (yAt(x1) > yMax) x1 = xAt(yMax);
      }
      curve = `<line x1="${sx(x0)}" y1="${sy(yAt(x0))}" x2="${sx(x1)}" y2="${sy(yAt(x1))}" stroke="#7c3aed" stroke-width="2.5"/>`;
    }

    let pts = '';
    if (opts.showPoints && opts.pointA && opts.pointB) {
      const [ax, ay] = opts.pointA, [bx, by] = opts.pointB;
      pts += `<line x1="${sx(ax)}" y1="${sy(ay)}" x2="${sx(bx)}" y2="${sy(ay)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3"/>`;
      pts += `<line x1="${sx(bx)}" y1="${sy(ay)}" x2="${sx(bx)}" y2="${sy(by)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3"/>`;
      pts += `<circle cx="${sx(ax)}" cy="${sy(ay)}" r="4.5" fill="#7c3aed"/><text x="${sx(ax)-9}" y="${sy(ay)-8}" font-size="11" font-weight="700" fill="#5b21b6">A</text>`;
      pts += `<circle cx="${sx(bx)}" cy="${sy(by)}" r="4.5" fill="#7c3aed"/><text x="${sx(bx)+7}" y="${sy(by)-8}" font-size="11" font-weight="700" fill="#5b21b6">B</text>`;
    }

    return `<svg viewBox="0 0 ${W} ${H}" class="pt-graph">
      ${gridLines}
      <line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#334155" stroke-width="1.5"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#334155" stroke-width="1.5"/>
      ${curve}
      ${pts}
      <text x="${padL + plotW}" y="${padT + plotH + 28}" font-size="10" fill="#334155" text-anchor="end" font-weight="700">${opts.xLabel}</text>
      <text x="${padL - 34}" y="${padT + 8}" font-size="10" fill="#334155" text-anchor="start" font-weight="700">${opts.yLabel}</text>
    </svg>`;
  }

  /* ---------- Schémas illustratifs du cours (tableau direct / inverse) ---------- */
  function ptCrossDiagramSvg() {
    return `<svg viewBox="0 0 260 150" class="pt-diagram">
      <rect x="10" y="10" width="120" height="35" fill="#7c3aed"/>
      <rect x="130" y="10" width="120" height="35" fill="#7c3aed"/>
      <text x="70" y="32" text-anchor="middle" fill="#fff" font-weight="700" font-size="14">Grandeur A</text>
      <text x="190" y="32" text-anchor="middle" fill="#fff" font-weight="700" font-size="14">Grandeur B</text>
      <rect x="10" y="45" width="120" height="45" fill="#f5f3ff" stroke="#ddd6fe"/>
      <rect x="130" y="45" width="120" height="45" fill="#f5f3ff" stroke="#ddd6fe"/>
      <text x="70" y="73" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">a</text>
      <text x="190" y="73" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">b</text>
      <rect x="10" y="90" width="120" height="45" fill="#fff" stroke="#ddd6fe"/>
      <rect x="130" y="90" width="120" height="45" fill="#fff" stroke="#ddd6fe"/>
      <text x="70" y="118" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">c</text>
      <text x="190" y="118" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">?</text>
      <path d="M 190,87 L 70,104 L 70,87 L 176,104 L 182,109" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ptArrow)"/>
      <defs><marker id="ptArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f59e0b"/></marker></defs>
    </svg>`;
  }
  function ptCrossDiagramInverseSvg() {
    return `<svg viewBox="0 0 260 150" class="pt-diagram">
      <rect x="10" y="10" width="120" height="35" fill="#7c3aed"/>
      <rect x="130" y="10" width="120" height="35" fill="#7c3aed"/>
      <text x="70" y="32" text-anchor="middle" fill="#fff" font-weight="700" font-size="14">Grandeur A</text>
      <text x="190" y="32" text-anchor="middle" fill="#fff" font-weight="700" font-size="14">Grandeur B</text>
      <rect x="10" y="45" width="120" height="45" fill="#f5f3ff" stroke="#ddd6fe"/>
      <rect x="130" y="45" width="120" height="45" fill="#f5f3ff" stroke="#ddd6fe"/>
      <text x="70" y="73" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">a</text>
      <text x="190" y="73" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">b</text>
      <rect x="10" y="90" width="120" height="45" fill="#fff" stroke="#ddd6fe"/>
      <rect x="130" y="90" width="120" height="45" fill="#fff" stroke="#ddd6fe"/>
      <text x="70" y="118" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">c</text>
      <text x="190" y="118" text-anchor="middle" fill="#5b21b6" font-weight="800" font-size="16">?</text>
      <path d="M 88 68 L 174 68" fill="none" stroke="#f59e0b" stroke-width="2.5" marker-end="url(#ptArrow2)"/>
      <text x="130" y="60" text-anchor="middle" fill="#b45309" font-weight="800" font-size="13">&times;</text>
      <path d="M 205 90 C 245 105, 165 118, 205 112" fill="none" stroke="#f59e0b" stroke-width="2.5" marker-end="url(#ptArrow2)"/>
      <text x="240" y="103" text-anchor="start" fill="#b45309" font-weight="800" font-size="13">&divide; c</text>
      <defs><marker id="ptArrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f59e0b"/></marker></defs>
    </svg>`;
  }

  /* ---------- Flux en deux étapes "Tableau puis formule" ----------
     Étape 1 : on place a, b, c dans le tableau de proportionnalité.
     Une fois validé, le tableau reste affiché et une formule vide
     ? = (... × ...) / ... apparaît juste dessous, avec un nouveau
     jeu des mêmes étiquettes à reporter dedans (glisser les données
     du tableau vers la formule). onDone() est appelé une fois la
     formule validée à son tour.
     opts: { labelA, unitA, labelB, unitB, a1:{label,value},
     b1:{label,value}, a2:{label,value}, distractors:[{id,label}],
     inverse (bool), onDone } */
  function ptTableauFlow(root, opts) {
    const distractors = opts.distractors || [];
    function chipsHtml(suffix) {
      return [
        ptChip('a1' + suffix, opts.a1.label, opts.a1.value),
        ptChip('b1' + suffix, opts.b1.label, opts.b1.value),
        ptChip('a2' + suffix, opts.a2.label, opts.a2.value),
      ].concat(distractors.map(d => ptChip(d.id + suffix, d.label))).join('');
    }

    function renderPhase1() {
      root.innerHTML = `
        <div class="pt-palette">${chipsHtml('_t')}</div>
        <table class="pt-table">
          <thead><tr><th>${opts.labelA} (${opts.unitA})</th><th>${opts.labelB} (${opts.unitB})</th></tr></thead>
          <tbody>
            <tr><td>${ptSlot('a1_t')}</td><td>${ptSlot('b1_t')}</td></tr>
            <tr><td>${ptSlot('a2_t')}</td><td>?</td></tr>
          </tbody>
        </table>
        <div class="text-center mt-3"><button type="button" class="btn-primary" id="ptfBtn1">Vérifier le tableau</button></div>
        <p id="ptfMsg1" class="verif-msg"></p>`;
      const eng = ptSlotEngine(root);
      let done1 = false;
      root.querySelector('#ptfBtn1').addEventListener('click', () => {
        if (done1) return;
        const r = eng.verify();
        const msg = root.querySelector('#ptfMsg1');
        if (r.correct === r.total) {
          done1 = true;
          msg.style.color = '#166534';
          msg.innerHTML = '✓ Tableau correct ! Reporte maintenant ces mêmes grandeurs dans la formule ci-dessous.';
          root.querySelector('#ptfBtn1').disabled = true;
          renderPhase2();
        } else {
          msg.style.color = '#991b1b';
          msg.textContent = `${r.correct}/${r.total} cases correctes.`;
        }
      });
    }

    function renderPhase2() {
      const nIds = (opts.inverse ? ['a1', 'b1'] : ['a2', 'b1']).map(x => x + '_f');
      const dId = (opts.inverse ? 'a2' : 'a1') + '_f';
      const div = document.createElement('div');
      div.className = 'pt-formula-phase';
      div.innerHTML = `
        <p class="text-sm font-bold text-gray-500 mb-2 mt-4">Reporte les grandeurs dans la formule (les deux grandeurs du numérateur peuvent être posées dans n'importe quel ordre) :</p>
        <div class="pt-palette">${chipsHtml('_f')}</div>
        <div class="formula-line">? = ( ${ptSlot(nIds)} &times; ${ptSlot(nIds)} ) / ${ptSlot(dId)}</div>
        <div class="text-center mt-3"><button type="button" class="btn-primary" id="ptfBtn2">Vérifier la formule</button></div>
        <p id="ptfMsg2" class="verif-msg"></p>`;
      root.appendChild(div);
      const eng2 = ptSlotEngine(div);
      let done2 = false;
      div.querySelector('#ptfBtn2').addEventListener('click', () => {
        if (done2) return;
        const r = eng2.verify();
        const msg = div.querySelector('#ptfMsg2');
        if (r.correct === r.total) {
          done2 = true;
          msg.style.color = '#166534';
          msg.textContent = '✓ Formule correcte !';
          div.querySelector('#ptfBtn2').disabled = true;
          if (opts.onDone) opts.onDone();
        } else {
          msg.style.color = '#991b1b';
          msg.textContent = `${r.correct}/${r.total} cases correctes.`;
        }
      });
    }

    renderPhase1();
  }

  window.ptFmt = ptFmt;
  window.ptHeader = ptHeader;
  window.ptSkipBtn = ptSkipBtn;
  window.ptFinish = ptFinish;
  window.ptConfetti = ptConfetti;
  window.ptSlotEngine = ptSlotEngine;
  window.ptTableauFlow = ptTableauFlow;
  window.ptChip = ptChip;
  window.ptSlot = ptSlot;
  window.ptFraction = ptFraction;
  window.ptGraphSvg = ptGraphSvg;
  window.ptCrossDiagramSvg = ptCrossDiagramSvg;
  window.ptCrossDiagramInverseSvg = ptCrossDiagramInverseSvg;
})();
