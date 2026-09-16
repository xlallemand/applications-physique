/* ============================================================
   Outils communs à l'application "Proportionnalité" (partagés par
   les modules de vérification des connaissances et d'entraînement
   de ce dossier uniquement — pas mutualisés avec les autres
   applications).

   Fournit :
   - l'en-tête de quiz (badge, titre, barre de progression, score)
   - l'écran de fin (score, détail, confettis si sans-faute)
   - un vérificateur de réponse numérique tolérant aux arrondis
   - un moteur générique de glisser-déposer "étiquette → case"
     (utilisé pour les tableaux de proportionnalité et les formules
     à trous)
   - un générateur de petits graphiques SVG (droites, points A/B)
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

  function ptParseNum(str) {
    if (str === null || str === undefined) return NaN;
    return parseFloat(String(str).trim().replace(',', '.').replace('−', '-'));
  }

  function ptNumOk(userStr, correct, tolerancePct) {
    const u = ptParseNum(userStr);
    if (isNaN(u)) return false;
    const tol = (tolerancePct === undefined ? 2 : tolerancePct) / 100;
    return Math.abs(u - correct) <= Math.max(Math.abs(correct) * tol, 1e-9);
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

  /* ---------- Glisser-déposer "étiquette → case" ----------
     chips : [{id, label, group}]  — group optionnel pour restreindre
             une étiquette à un sous-ensemble de cases (non utilisé
             par défaut : toutes les cases acceptent toutes les
             étiquettes tant que l'id ne correspond pas)
     Chaque case porte data-accept="<id attendu>".
     Après un dépôt correct, l'étiquette est déplacée physiquement
     dans la case (et retirée de la palette). */
  function ptWireSlots(root, onAllFilled) {
    if (window.DragDrop) DragDrop.cleanupGhosts();
    const chips = root.querySelectorAll('.pt-chip');
    function checkAllFilled() {
      const slots = root.querySelectorAll('.pt-slot');
      const done = Array.from(slots).every(s => s.classList.contains('filled'));
      if (done && onAllFilled) onAllFilled();
    }
    chips.forEach(chip => {
      if (chip.dataset.wired === '1') return;
      chip.dataset.wired = '1';
      DragDrop.enable(chip, {
        zoneSelector: '.pt-slot:not(.filled)',
        dragOverClass: 'pt-slot-over',
        onDrop: (item, zone) => {
          if (!zone) return;
          if (zone.dataset.accept === item.dataset.chipId) {
            zone.classList.add('filled');
            zone.innerHTML = '';
            item.classList.remove('dragging');
            item.setAttribute('draggable', 'false');
            item.style.cursor = 'default';
            zone.appendChild(item);
            checkAllFilled();
          } else {
            zone.classList.add('pt-slot-wrong');
            setTimeout(() => zone.classList.remove('pt-slot-wrong'), 450);
          }
        },
      });
    });
  }

  function ptChip(id, label) {
    return `<button type="button" class="pt-chip" data-chip-id="${id}">${label}</button>`;
  }
  function ptSlot(accept, placeholder) {
    return `<span class="pt-slot" data-accept="${accept}"><span class="pt-slot-ph">${placeholder || '?'}</span></span>`;
  }

  /* ---------- Petit graphique SVG (droite + 2 points repérés) ----------
     opts: { xMax, yMax, xLabel, yLabel, k (coefficient, null si pas
     proportionnel), intercept (ordonnée à l'origine, def 0),
     curved (bool), pointA:[x,y], pointB:[x,y], showPoints (bool) } */
  function ptGraphSvg(opts) {
    const W = 300, H = 230, padL = 46, padB = 34, padT = 14, padR = 14;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const xMax = opts.xMax, yMax = opts.yMax;
    const sx = x => padL + (x / xMax) * plotW;
    const sy = y => padT + plotH - (y / yMax) * plotH;

    let gridLines = '';
    const nx = 4, ny = 4;
    for (let i = 0; i <= nx; i++) {
      const x = (xMax / nx) * i;
      gridLines += `<line x1="${sx(x)}" y1="${padT}" x2="${sx(x)}" y2="${padT + plotH}" stroke="#e2e8f0" stroke-width="1"/>`;
      gridLines += `<text x="${sx(x)}" y="${padT + plotH + 16}" font-size="9" fill="#64748b" text-anchor="middle">${ptFmt(x, 1)}</text>`;
    }
    for (let i = 0; i <= ny; i++) {
      const y = (yMax / ny) * i;
      gridLines += `<line x1="${padL}" y1="${sy(y)}" x2="${padL + plotW}" y2="${sy(y)}" stroke="#e2e8f0" stroke-width="1"/>`;
      gridLines += `<text x="${padL - 6}" y="${sy(y) + 3}" font-size="9" fill="#64748b" text-anchor="end">${ptFmt(y, 1)}</text>`;
    }

    let curve = '';
    if (opts.curved) {
      let d = '';
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const x = (xMax * i) / n;
        const y = opts.curveFn(x);
        d += (i === 0 ? 'M' : 'L') + sx(x) + ',' + sy(Math.min(y, yMax));
      }
      curve = `<path d="${d}" fill="none" stroke="#7c3aed" stroke-width="2.5"/>`;
    } else {
      const b = opts.intercept || 0;
      const y0 = b, y1 = opts.k * xMax + b;
      curve = `<line x1="${sx(0)}" y1="${sy(Math.max(0,Math.min(y0,yMax)))}" x2="${sx(xMax)}" y2="${sy(Math.max(0,Math.min(y1,yMax)))}" stroke="#7c3aed" stroke-width="2.5"/>`;
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

  window.ptFmt = ptFmt;
  window.ptParseNum = ptParseNum;
  window.ptNumOk = ptNumOk;
  window.ptHeader = ptHeader;
  window.ptFinish = ptFinish;
  window.ptConfetti = ptConfetti;
  window.ptWireSlots = ptWireSlots;
  window.ptChip = ptChip;
  window.ptSlot = ptSlot;
  window.ptGraphSvg = ptGraphSvg;
})();
