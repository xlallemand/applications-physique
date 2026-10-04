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
    const H = Math.round(Math.min(c.hMax || 245, Math.max(c.hMin || 170, W * (c.ratio || 0.38))));
    // marge droite identique avec ou sans axe de droite : l'axe des temps a la même longueur
    // sur tous les graphiques, qui restent alignés l'un sous l'autre
    const m = { g: petit ? 44 : 54, d: petit ? 42 : 52, h: 26, b: 26 };
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
        retour.innerHTML = '';                            // efface la consigne ou l'erreur précédente
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

    // Éclairage LED (gymnase) : panneau de LED, son alimentation électronique à condensateurs, cône de lumière
    capacitif: `<svg viewBox="0 0 140 96" aria-hidden="true">
      <line x1="4" y1="4" x2="136" y2="4" stroke="#8d8f94" stroke-width="2"/>
      <path d="M34 4v16M106 4v16" stroke="#8d8f94" stroke-width="1.5"/>
      <polygon points="22,30 118,30 136,94 4,94" fill="#fde68a" opacity=".45"/>
      <rect x="18" y="20" width="104" height="10" rx="3" fill="#fff" stroke="#55585f" stroke-width="2"/>
      <g fill="#f5b400">
        <circle cx="28" cy="27" r="2.2"/><circle cx="40" cy="27" r="2.2"/><circle cx="52" cy="27" r="2.2"/><circle cx="64" cy="27" r="2.2"/>
        <circle cx="76" cy="27" r="2.2"/><circle cx="88" cy="27" r="2.2"/><circle cx="100" cy="27" r="2.2"/><circle cx="112" cy="27" r="2.2"/>
      </g>
      <rect x="54" y="6" width="32" height="12" rx="2" fill="#3552a8"/>
      <path d="M65 12h6M75 12h6M71 8.5v7M75 8.5v7" stroke="#fff" stroke-width="1.6"/>
      <g stroke="#e0a400" stroke-width="1.6" stroke-linecap="round" opacity=".8">
        <line x1="40" y1="40" x2="34" y2="58"/><line x1="70" y1="40" x2="70" y2="60"/><line x1="100" y1="40" x2="106" y2="58"/>
      </g>
    </svg>`,

    // Plaque à induction vue en coupe : casserole, vitre, bobine de cuivre (inducteur) et lignes de champ
    inductif: (function () {
      let spires = '';
      for (let k = 0; k < 5; k++) {
        spires += `<circle cx="${27 + k * 7.5}" cy="70" r="3.3" fill="#cf7a2b" stroke="#8a4510" stroke-width="1"/>`;
        spires += `<circle cx="${83 + k * 7.5}" cy="70" r="3.3" fill="#cf7a2b" stroke="#8a4510" stroke-width="1"/>`;
      }
      return `<svg viewBox="0 0 140 96" aria-hidden="true">
        <g fill="none" stroke="#e07a10" stroke-width="2.2" stroke-linecap="round" opacity=".75">
          <path d="M56 18c-4-4 4-7 0-11"/><path d="M70 18c-4-4 4-7 0-11"/><path d="M84 18c-4-4 4-7 0-11"/>
        </g>
        <rect x="100" y="27" width="34" height="6" rx="3" fill="#55585f"/>
        <rect x="40" y="22" width="60" height="26" rx="4" fill="#b7bcc4" stroke="#55585f" stroke-width="2"/>
        <rect x="6" y="48" width="128" height="7" rx="3" fill="#2b3040"/>
        <rect x="12" y="56" width="116" height="34" rx="4" fill="#f3f1ec" stroke="#8d8f94" stroke-width="1.2" stroke-dasharray="4 3"/>
        <g fill="none" stroke="#5a3fc4" stroke-width="1.4" stroke-dasharray="3 3">
          <path d="M45 70C45 36 95 36 95 70"/><path d="M34 70C34 26 106 26 106 70"/>
        </g>
        ${spires}
        <rect x="22" y="78" width="96" height="5" rx="2" fill="#55585f"/>
      </svg>`;
    })()
  };

  /* ============================================================
     CURSEUR AU DOIGT
     Sur écran tactile (iOS en particulier), un appui sur la piste d'un
     <input type="range"> ne déplace pas le bouton : on gère nous-mêmes
     l'appui et le glissement n'importe où sur la piste.
     ============================================================ */
  function curseurTactile(range) {
    const pouce = 30;                                   // diamètre du bouton (pa.css)
    function placer(ev) {
      const r = range.getBoundingClientRect();
      const min = +range.min, max = +range.max, pas = +range.step || 1;
      const k = Math.max(0, Math.min(1, (ev.clientX - r.left - pouce / 2) / (r.width - pouce)));
      const v = Math.round((min + k * (max - min)) / pas) * pas;
      if (+range.value !== v) {
        range.value = v;
        range.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    // on bloque le comportement natif au doigt (sinon double gestion)
    range.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    range.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;            // souris : comportement natif
      range.setPointerCapture(e.pointerId);
      placer(e);
      const bouger = ev => placer(ev);
      const fin = () => {
        range.removeEventListener('pointermove', bouger);
        range.removeEventListener('pointerup', fin);
        range.removeEventListener('pointercancel', fin);
      };
      range.addEventListener('pointermove', bouger);
      range.addEventListener('pointerup', fin);
      range.addEventListener('pointercancel', fin);
    });
  }

  /* Déphasage écrit en degrés et en radians : « 45° = π/4 rad ≈ 0,79 rad » */
  const FRACTIONS_PI = { 15: 'π/12', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2' };
  function radians(deg, court) {
    const a = Math.abs(deg), signe = deg < 0 ? '−' : '';
    if (a === 0) return '0 rad';
    const approx = fmt(a * Math.PI / 180, 2);
    if (FRACTIONS_PI[a]) return court ? `${signe}${FRACTIONS_PI[a]} rad` : `${signe}${FRACTIONS_PI[a]} rad ≈ ${signe}${approx} rad`;
    return `≈ ${signe}${approx} rad`;
  }

  /* ============================================================
     BANDEAU ET MENU COMMUNS AUX MODULES
     ============================================================ */
  const GROUPES = [
    { title: 'Module 1 · La valeur efficace', items: [
      { key: 'module_1', label: 'La valeur efficace' },
    ]},
    { title: 'Module 2 · La puissance active', items: [
      { key: 'module_2', label: 'Comprendre à quoi correspond la puissance active' },
    ]},
    { title: 'Module 3 · Mesurer un déphasage', items: [
      { key: 'module_3_cours', label: 'Cours : mesurer un déphasage' },
      { key: 'module_3_questions', label: 'Questions sur le déphasage' },
    ]},
    { title: 'Module 4 · La puissance active en exercices', items: [
      { key: 'module_4_cours', label: 'Cours : les puissances et le schéma de conversion' },
      { key: 'module_4_exercices', label: "Exercices d'application" },
    ]},
  ];
  // cle : clé du module affiché (null sur la page d'accueil) ; dossier : chemin vers les modules
  function menu(cle, dossier) {
    const d = dossier === undefined ? '' : dossier;
    const n = window.AppNav.init({
      appName: 'Puissance active',
      portalHref: (cle ? '../' : '') + '../index.html',
      portalLabel: 'Toutes les applications',
      onHome: () => { if (cle) window.location.href = '../index.html'; },
      onNavigate: key => { window.location.href = d + key + '.html'; },
      groups: GROUPES,
    });
    n.setActive(cle);
    const g = GROUPES.find(x => x.items.some(m => m.key === cle));
    const item = g && g.items.find(m => m.key === cle);
    n.setTitle(item ? `${g.title.split(' · ')[0]} · ${item.label}` : null);
    return n;
  }

  window.PA = { COUL, OMEGA, fmt, radians, Graphe, svg, quiz, dessins, curseurTactile, GROUPES, menu };
})();
