/* ============================================================
   Outils de l'application « Puissance active »
     PA.Graphe      graphique SVG (u, i, p en fonction du temps)
     PA.quiz        questions progressives avec explications
     PA.dessins     illustrations des trois types de circuits
   ============================================================ */
(function () {
  'use strict';

  // Couleurs des grandeurs (identiques à pa.css)
  const COUL = { u: '#2952c8', i: '#d9730d', p: '#5a3fc4', neg: '#0e97a6', ink: '#16181d', ink3: '#8d8f94', grille: '#eceae4' };

  // Signal du secteur : f = 50 Hz, T = 20 ms ; pulsation en rad/ms
  const OMEGA = 2 * Math.PI / 20;

  // Nombre à la française : virgule décimale, vrai signe moins
  function fmt(x, d = 0) {
    if (Math.abs(x) < 0.5 * Math.pow(10, -d)) x = 0;
    return x.toFixed(d).replace('.', ',').replace('-', '−');
  }

  /* ============================================================
     GRAPHIQUE
     cfg = {
       tmax, pasT,                        durée affichée et pas des graduations (ms)
       axes: [{ min, max, pas, nom, unite, couleur, decimales }],   1 ou 2 axes (gauche, droite)
       courbes: [{ f, axe, couleur, largeur, aires: { pos, neg, de, a } }],
       calques: g => '<svg…>'             éléments ajoutés par-dessus (droites, annotations)
       ratio, hMin, hMax                  hauteur du graphique selon sa largeur
     }
     ============================================================ */
  function Graphe(el, cfg) {
    this.el = el;
    this.cfg = cfg;
    this.g = null;                      // échelles du dernier dessin (utilisées pour le glisser)
    const moi = this;
    let largeur = 0;
    // redessin quand la largeur change (rotation du téléphone, fenêtre redimensionnée)
    if (window.ResizeObserver) {
      new ResizeObserver(() => { if (el.clientWidth !== largeur) { largeur = el.clientWidth; moi.dessiner(); } }).observe(el);
    } else {
      addEventListener('resize', () => moi.dessiner());
    }
    this.dessiner();
  }

  Graphe.prototype.maj = function (modif) {
    Object.assign(this.cfg, modif || {});
    this.dessiner();
  };

  Graphe.prototype.dessiner = function () {
    const W = this.el.clientWidth;
    if (!W) return;
    const c = this.cfg, petit = W < 520, ax = c.axes, deux = ax.length > 1;
    const H = Math.round(Math.min(c.hMax || 260, Math.max(c.hMin || 170, W * (c.ratio || 0.42))));
    const m = { g: petit ? 44 : 54, d: deux ? (petit ? 42 : 52) : (petit ? 12 : 18), h: 26, b: 26 };
    const x0 = m.g, x1 = W - m.d, y0 = m.h, y1 = H - m.b;
    const X = t => x0 + t / c.tmax * (x1 - x0);
    const Y = (v, k) => { const a = ax[k || 0]; return y0 + (a.max - v) / (a.max - a.min) * (y1 - y0); };
    const g = { W, H, x0, x1, y0, y1, X, Y, petit, fmt, COUL };
    this.g = g;
    const fs = petit ? 10.5 : 12;
    let s = '';

    // Quadrillage vertical (temps)
    for (let t = 0; t <= c.tmax + 1e-9; t += c.pasT) {
      s += `<line x1="${X(t)}" y1="${y0}" x2="${X(t)}" y2="${y1}" stroke="${COUL.grille}" stroke-width="1"/>`;
    }
    // Quadrillage horizontal (graduations de l'axe de gauche)
    const a0 = ax[0];
    for (let v = a0.min; v <= a0.max + 1e-9; v += a0.pas) {
      s += `<line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" stroke="${COUL.grille}" stroke-width="1"/>`;
    }
    // Cadre
    s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="#dfdbd2" stroke-width="1"/>`;

    // Aires sous les courbes (avant les tracés)
    const N = Math.max(240, Math.round((x1 - x0) / 1.2));
    (c.courbes || []).forEach(cb => {
      if (!cb.aires) return;
      const de = cb.aires.de || 0, a = cb.aires.a === undefined ? c.tmax : cb.aires.a;
      if (a <= de) return;
      const n = Math.max(2, Math.round(N * (a - de) / c.tmax));
      [['pos', v => Math.max(v, 0)], ['neg', v => Math.min(v, 0)]].forEach(([cle, borne]) => {
        if (!cb.aires[cle]) return;
        let d = `M${X(de).toFixed(1)},${Y(0, cb.axe).toFixed(1)}`;
        for (let j = 0; j <= n; j++) {
          const t = de + (a - de) * j / n;
          d += `L${X(t).toFixed(1)},${Y(borne(cb.f(t)), cb.axe).toFixed(1)}`;
        }
        d += `L${X(a).toFixed(1)},${Y(0, cb.axe).toFixed(1)}Z`;
        s += `<path d="${d}" fill="${cb.aires[cle]}" fill-opacity="${cb.aires.opacite || 0.3}" stroke="none"/>`;
      });
    });

    // Axe des temps (valeur 0)
    s += `<line x1="${x0}" y1="${Y(0)}" x2="${x1}" y2="${Y(0)}" stroke="${COUL.ink}" stroke-opacity=".55" stroke-width="1.3"/>`;

    // Calques placés sous les courbes
    if (c.calquesDessous) s += c.calquesDessous(g);

    // Courbes
    (c.courbes || []).forEach(cb => {
      let d = '';
      for (let j = 0; j <= N; j++) {
        const t = c.tmax * j / N;
        let v = cb.f(t);
        const a = ax[cb.axe || 0];
        v = Math.max(a.min, Math.min(a.max, v));
        d += (j ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(v, cb.axe).toFixed(1);
      }
      s += `<path d="${d}" fill="none" stroke="${cb.couleur}" stroke-width="${cb.largeur || 2.5}" stroke-linejoin="round" stroke-linecap="round"/>`;
    });

    // Graduations et noms des axes
    const dec = a => a.decimales || 0;
    for (let v = a0.min; v <= a0.max + 1e-9; v += a0.pas) {
      s += `<text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="${fs}" font-weight="600" fill="${a0.couleur}">${fmt(v, dec(a0))}</text>`;
    }
    s += `<text x="${x0 - 6}" y="${y0 - 10}" text-anchor="end" font-size="${fs + 1}" font-weight="800" fill="${a0.couleur}">${a0.nom} (${a0.unite})</text>`;
    if (deux) {
      const a1 = ax[1];
      for (let v = a1.min; v <= a1.max + 1e-9; v += a1.pas) {
        s += `<text x="${x1 + 6}" y="${Y(v, 1) + 4}" text-anchor="start" font-size="${fs}" font-weight="600" fill="${a1.couleur}">${fmt(v, dec(a1))}</text>`;
      }
      s += `<text x="${x1 + 6}" y="${y0 - 10}" text-anchor="start" font-size="${fs + 1}" font-weight="800" fill="${a1.couleur}">${a1.nom} (${a1.unite})</text>`;
    }
    const pasTexte = petit ? c.pasT * 2 : c.pasT;
    for (let t = 0; t <= c.tmax + 1e-9; t += pasTexte) {
      s += `<text x="${X(t)}" y="${y1 + 17}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${COUL.ink3}">${fmt(t)}</text>`;
    }
    // nom de l'axe des temps, du côté de l'axe où la première courbe ne passe pas en fin de graphique
    const c0 = (c.courbes || [])[0], dessous = c0 && c0.f(c.tmax * 0.96) > 0;
    s += svg.etiquette(x1 - 4, Y(0) + (dessous ? 15 : -6), 't (ms)', COUL.ink3, 'end', petit);

    // Calques par-dessus (annotations, droites…)
    if (c.calques) s += c.calques(g);

    const code = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${c.titre || 'graphique'}">${s}</svg>`;
    // on garde les éléments HTML ajoutés au graphique (poignée) : seul le SVG est remplacé
    const ancien = this.el.querySelector('svg');
    if (ancien) ancien.outerHTML = code; else this.el.insertAdjacentHTML('afterbegin', code);
    if (this.apresDessin) this.apresDessin(g);
  };

  /* Petits éléments SVG réutilisables dans les calques */
  const svg = {
    // droite horizontale en pointillés avec étiquette
    niveau(g, y, couleur, texte, cote) {
      const droite = cote === 'd';
      return `<line x1="${g.x0}" y1="${y}" x2="${g.x1}" y2="${y}" stroke="${couleur}" stroke-width="1.8" stroke-dasharray="6 5"/>` +
        (texte ? svg.etiquette(droite ? g.x1 - 6 : g.x0 + 6, droite ? y + 16 : y - 7, texte, couleur, droite ? 'end' : 'start', g.petit) : '');
    },
    // texte sur fond blanc (lisible par-dessus les courbes)
    etiquette(x, y, texte, couleur, ancre, petit) {
      const fs = petit ? 11 : 12.5;
      return `<text x="${x}" y="${y}" text-anchor="${ancre || 'start'}" font-size="${fs}" font-weight="800" fill="${couleur}" ` +
        `stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke">${texte}</text>`;
    }
  };

  /* ============================================================
     QUESTIONS PROGRESSIVES
     questions = [{
       texte, consigne,                   énoncé (HTML) et consigne d'action éventuelle
       choix: [{ t, ok, pourquoi }],      QCM : pourquoi = explication si ce choix est faux
       verif: () => ({ ok, msg }),        OU vérification d'une manipulation (bouton « Valider »)
       prealable: () => msg | null,       manipulation à faire avant de répondre (sinon message)
       bravo,                             explication affichée quand c'est juste (HTML ou fonction)
       resume,                            réponse retenue, pour le parcours
       avant(), apres()                   actions à l'affichage / après une bonne réponse
     }]
     ============================================================ */
  function quiz(el, questions, options) {
    options = options || {};
    let n = 0;
    const faites = [];

    function afficher() {
      const q = questions[n];
      if (q.avant) q.avant();
      const total = questions.length;
      el.innerHTML = `
        <div class="pa-card pa-quiz">
          <div class="pa-quiz-tete">
            <span class="pa-quiz-num">Question ${n + 1} / ${total}</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(n / total * 100)}%"></div></div>
          </div>
          <p class="pa-question">${q.texte}</p>
          ${q.consigne ? `<div class="pa-consigne"><span>${q.consigne}</span></div>` : ''}
          ${q.choix ? `<div class="pa-choix">${q.choix.map((c, k) =>
            `<button type="button" class="btn-secondary" data-k="${k}">${c.t}</button>`).join('')}</div>` : ''}
          <div class="pa-actions">
            <button type="button" class="btn-primary pa-valider" ${q.choix ? 'disabled' : ''}>Valider</button>
          </div>
          <div class="pa-retour" aria-live="polite"></div>
        </div>
        ${parcours()}`;

      const boutons = el.querySelectorAll('.pa-choix button');
      const valider = el.querySelector('.pa-valider');
      const retour = el.querySelector('.pa-retour');
      let choisi = null;

      boutons.forEach(b => b.addEventListener('click', () => {
        boutons.forEach(x => x.classList.remove('choisi'));
        b.classList.add('choisi');
        choisi = +b.dataset.k;
        valider.disabled = false;
      }));

      valider.addEventListener('click', () => {
        // manipulation préalable non faite
        const manque = q.prealable ? q.prealable() : null;
        if (manque) {
          retour.innerHTML = `<div class="callout-accent"><b>Avant de répondre :</b> ${manque}</div>`;
          secouer(retour);
          return;
        }
        let ok, msg;
        if (q.choix) {
          const c = q.choix[choisi];
          ok = !!c.ok;
          msg = ok ? '' : (c.pourquoi || 'Observe à nouveau le graphique et réessaie.');
          const b = boutons[choisi];
          b.classList.remove('choisi');
          b.classList.add(ok ? 'opt-correct' : 'opt-wrong');
          if (!ok) { b.disabled = true; choisi = null; valider.disabled = true; }
        } else {
          const r = q.verif();
          ok = r.ok; msg = r.msg || '';
        }
        if (ok) {
          const bravo = typeof q.bravo === 'function' ? q.bravo() : q.bravo;
          boutons.forEach(b => { b.disabled = true; });
          retour.innerHTML = `<div class="callout-success"><p><b class="pa-ok">✓ Exact !</b> ${bravo}</p></div>`;
          faites.push({ texte: q.court || q.texte, resume: typeof q.resume === 'function' ? q.resume() : q.resume, bravo });
          if (q.apres) q.apres();
          const fin = n === questions.length - 1;
          valider.outerHTML = `<button type="button" class="btn-primary pa-suivant">${fin ? 'Voir le bilan →' : 'Question suivante →'}</button>`;
          const suiv = el.querySelector('.pa-suivant');
          suiv.addEventListener('click', () => {
            n++;
            if (n < questions.length) afficher(); else terminer();
            // ramène la question en haut de l'écran si elle est sortie de la vue
            const r = el.getBoundingClientRect();
            if (r.top < 60 || r.top > innerHeight - 120) scrollTo({ top: scrollY + r.top - 76, behavior: 'smooth' });
          });
          suiv.focus({ preventScroll: true });
        } else {
          retour.innerHTML = `<div class="callout-danger"><p><b class="pa-ko">✕ Pas tout à fait.</b> ${msg}</p></div>`;
          secouer(retour);
        }
      });
    }

    function parcours() {
      if (!faites.length) return '';
      return `<details class="pa-parcours pa-card"${options.parcoursOuvert ? ' open' : ''}>
        <summary>Ce que tu as trouvé (${faites.length})</summary>
        <ol>${faites.map((f, k) => `<li><span class="q">${k + 1}. ${f.resume || ''}</span><br>${f.bravo}</li>`).join('')}</ol>
      </details>`;
    }

    function terminer() {
      el.innerHTML = parcours();
      if (options.fin) options.fin();
    }

    function secouer(x) {
      x.classList.remove('pa-secoue'); void x.offsetWidth; x.classList.add('pa-secoue');
    }

    afficher();
    return { etape: () => n };
  }

  /* ============================================================
     ILLUSTRATIONS DES CIRCUITS (SVG, dessinées à la main)
     ============================================================ */
  const dessins = {
    // Radiateur électrique : résistance chauffante, ondes de chaleur
    resistif: `<svg viewBox="0 0 140 96" aria-hidden="true">
      <g fill="none" stroke="#e07a10" stroke-width="2.5" stroke-linecap="round" opacity=".8">
        <path d="M40 26c-5-5 5-9 0-14s5-9 0-12"/><path d="M70 26c-5-5 5-9 0-14s5-9 0-12"/><path d="M100 26c-5-5 5-9 0-14s5-9 0-12"/>
      </g>
      <rect x="16" y="32" width="108" height="50" rx="8" fill="#fff" stroke="#55585f" stroke-width="2.5"/>
      <g stroke="#c9c4b9" stroke-width="5" stroke-linecap="round">
        <line x1="30" y1="42" x2="30" y2="72"/><line x1="42" y1="42" x2="42" y2="72"/><line x1="54" y1="42" x2="54" y2="72"/>
        <line x1="66" y1="42" x2="66" y2="72"/><line x1="78" y1="42" x2="78" y2="72"/><line x1="90" y1="42" x2="90" y2="72"/>
      </g>
      <rect x="100" y="40" width="16" height="34" rx="4" fill="#f3f1ec" stroke="#8d8f94" stroke-width="1.5"/>
      <circle cx="108" cy="50" r="4.5" fill="#fff" stroke="#55585f" stroke-width="1.5"/><line x1="108" y1="50" x2="110.5" y2="46.5" stroke="#55585f" stroke-width="1.5"/>
      <circle cx="108" cy="65" r="2.5" fill="#e0492f"/>
      <path d="M26 82v8M114 82v8" stroke="#55585f" stroke-width="4" stroke-linecap="round"/>
    </svg>`,

    // Condensateur (électrochimique) sur sa carte électronique
    capacitif: `<svg viewBox="0 0 140 96" aria-hidden="true">
      <rect x="12" y="74" width="116" height="14" rx="3" fill="#2f7d5b"/>
      <g fill="#d6c38a"><circle cx="24" cy="81" r="2.5"/><circle cx="116" cy="81" r="2.5"/><circle cx="36" cy="81" r="2"/><circle cx="104" cy="81" r="2"/></g>
      <path d="M36 81h14M90 81h14" stroke="#d6c38a" stroke-width="2"/>
      <line x1="60" y1="66" x2="60" y2="80" stroke="#8d8f94" stroke-width="3"/><line x1="80" y1="66" x2="80" y2="80" stroke="#8d8f94" stroke-width="3"/>
      <rect x="46" y="12" width="48" height="58" rx="8" fill="#3552a8"/>
      <rect x="46" y="12" width="14" height="58" rx="6" fill="#a9b7df"/>
      <rect x="54" y="12" width="6" height="58" fill="#a9b7df"/>
      <g fill="#3552a8" font-family="sans-serif" font-weight="800" font-size="11"><text x="49.5" y="32">−</text><text x="49.5" y="48">−</text><text x="49.5" y="64">−</text></g>
      <ellipse cx="70" cy="13" rx="24" ry="5" fill="#c7cbd3" stroke="#8d8f94" stroke-width="1.2"/>
      <path d="M62 11l16 4M78 11l-16 4" stroke="#8d8f94" stroke-width="1.4"/>
      <text x="79" y="46" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700" font-size="8.5">470 µF</text>
      <path d="M100 30h14M100 38h14" stroke="#16181d" stroke-width="3"/><path d="M107 16v14M107 38v14" stroke="#16181d" stroke-width="2"/>
    </svg>`,

    // Moteur électrique vu en coupe : bobinages en cuivre autour des dents du stator
    inductif: (function () {
      const cx = 70, cy = 48;
      let bob = '';
      for (let k = 0; k < 6; k++) {
        const a = k * 60;
        // une dent du stator entourée de son bobinage (spires en cuivre)
        let spires = '';
        for (let j = 0; j < 6; j++) spires += `<line x1="${-8}" y1="${-31 + j * 3.2}" x2="${8}" y2="${-31 + j * 3.2}" stroke="#8a4510" stroke-width="1"/>`;
        bob += `<g transform="rotate(${a} ${cx} ${cy}) translate(${cx} ${cy})">
          <rect x="-4" y="-36" width="8" height="20" fill="#9aa0a8"/>
          <rect x="-9" y="-33" width="18" height="15" rx="3" fill="#cf7a2b" stroke="#8a4510" stroke-width="1.2"/>
          ${spires}
        </g>`;
      }
      return `<svg viewBox="0 0 140 96" aria-hidden="true">
        <rect x="116" y="44" width="22" height="8" rx="2" fill="#8d8f94"/>
        <circle cx="${cx}" cy="${cy}" r="46" fill="#dfdbd2" stroke="#55585f" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="41" fill="#b7bcc4" stroke="#8d8f94" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${cy}" r="35" fill="#fff" stroke="#8d8f94" stroke-width="1"/>
        ${bob}
        <circle cx="${cx}" cy="${cy}" r="12.5" fill="#9aa0a8" stroke="#55585f" stroke-width="1.5"/>
        <path d="M${cx - 12} ${cy}h24M${cx} ${cy - 12}v24" stroke="#7d838b" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="4" fill="#55585f"/>
      </svg>`;
    })()
  };

  window.PA = { COUL, OMEGA, fmt, Graphe, svg, quiz, dessins };
})();
