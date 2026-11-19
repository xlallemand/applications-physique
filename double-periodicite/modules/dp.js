/* ============================================================
   Double périodicité d'une onde — moteur du simulateur (objet DP)

   Un émetteur E (x = 0) émet, à partir de t = 0, une onde périodique
   de fréquence f qui se propage à la célérité c. Le récepteur R est
   placé à la distance D ; le milieu représenté s'étend une longueur
   d'onde au-delà de R (de 0 à D + λ).
     y(x, t) = g(f × (t − x / c))  si t ≥ x / c,  0 sinon
   g : motif de période 1 (sinusoïde, ou montée lente, descente rapide
   et palier : motif dissymétrique, qu'on voit retourné dans l'espace),
   normalisé pour que sa crête vaille 1.

   Deux graphes, tracés en direct :
     - périodicité spatiale : y(x) de E jusqu'à λ après R, à l'instant t ;
     - périodicité temporelle : signal reçu par R en fonction de t.
   Bouton « Afficher les périodes » : double flèche λ entre deux crêtes
   voisines du profil spatial (elle suit l'onde) et double flèche T entre
   deux crêtes voisines du signal reçu (elle suit le papier qui défile).
   Démonstration « Suivre l'onde pendant T » : une crête est suivie
   pendant une période à partir de R ; elle s'éloigne de R d'une
   longueur d'onde : distance parcourue pendant T = λ, donc c = λ / T.
   Illustrations de mise en situation : on filme l'onde (graphe du
   haut), un stylo suit le signal sur un papier qui défile (bas).

   API : DP.etat (lecture seule, pour les tests).
   ============================================================ */
const DP = (function () {
  'use strict';

  const D = 4;                         // distance émetteur – récepteur (m)
  const BASE = 0.5;                    // vitesse de base de l'animation (« × 1 » : 0,5 s simulée par seconde)
  const NB = ' ';                 // espace insécable
  const UC = 'm·s<sup>−1</sup>';       // unité de la célérité

  // ---------- Motifs de période 1 ----------
  const BRUT = {
    sin: u => Math.sin(2 * Math.PI * u),
    // non sinusoïdal : montée lente (60 % de la période), descente rapide (10 %), palier au repos (30 %).
    // Le signal temporel monte lentement puis chute ; le profil spatial, parcouru de E vers R,
    // montre le même motif retourné de gauche à droite (montée brusque, descente lente).
    cplx: u => { u -= Math.floor(u); return u < 0.6 ? u / 0.6 : u < 0.7 ? (0.7 - u) / 0.1 : 0; }
  };
  // crête de chaque motif (valeur maximale et phase où elle est atteinte), calculée une fois
  const MOTIF = {};
  Object.keys(BRUT).forEach(k => {
    let max = -Infinity, uMax = 0;
    for (let i = 0; i < 20000; i++) {
      const u = i / 20000, v = BRUT[k](u);
      if (v > max) { max = v; uMax = u; }
    }
    MOTIF[k] = { g: u => BRUT[k](u) / max, uCrete: uMax };
  });

  // ---------- État ----------
  const etat = {
    forme: 'sin', f: 1, c: 2,           // réglages
    t: 0,                               // instant (s), t = 0 : début de l'émission
    lecture: false, vitesse: 1,         // animation
    masque: false,                      // valeurs T et λ masquées
    demo: null,                         // { phase: 'attente' | 'suivi' | 'fin', t1 }
    periodes: false                     // doubles flèches λ et T affichées
  };
  const T = () => 1 / etat.f;
  const lam = () => etat.c / etat.f;
  const L = () => D + lam();            // longueur du milieu représenté : jusqu'à λ après R
  const t0 = () => D / etat.c;          // arrivée du front en R

  // élongation au point x à l'instant t
  function y(x, t) {
    const tau = t - x / etat.c;
    return tau < 0 ? 0 : MOTIF[etat.forme].g(etat.f * tau);
  }

  // ---------- Écriture des nombres ----------
  function fmt(v, cs) {                 // cs chiffres significatifs, virgule décimale
    let s = Number(v).toPrecision(cs || 3);
    if (s.indexOf('e') >= 0) s = String(Number(s));
    return s.replace('.', ',');
  }
  const fixe = (v, d) => v.toFixed(d).replace('.', ',').replace('-', '−');

  // ---------- Éléments de la page ----------
  const $ = id => document.getElementById(id);
  const zEsp = $('dp-espace'), zTps = $('dp-temps');
  const bLecture = $('dp-lecture'), bSuivre = $('dp-suivre'), bMasquer = $('dp-masquer'), msg = $('dp-msg');
  const bPeriodes = $('dp-periodes');

  // ---------- Avancer le temps ----------
  // dt : durée simulée ; la démonstration s'arrête exactement aux instants t1 et t1 + T
  function avancer(dt) {
    let tn = etat.t + dt;
    const d = etat.demo;
    if (d && d.phase === 'attente' && tn >= d.t1) { tn = d.t1; d.phase = 'suivi'; }
    else if (d && d.phase === 'suivi' && tn >= d.t1 + T()) { tn = d.t1 + T(); d.phase = 'fin'; lecture(false); }
    etat.t = tn;
  }

  // ---------- Boucle d'animation ----------
  let avant = 0, boucle = 0;
  function image(ms) {
    const dt = Math.min(0.1, (ms - avant) / 1000);     // onglet en arrière-plan : pas de saut
    avant = ms;
    if (etat.lecture) avancer(dt * etat.vitesse * BASE);
    rendre();
    boucle = etat.lecture ? requestAnimationFrame(image) : 0;
  }
  function lecture(oui) {
    etat.lecture = oui;
    bLecture.textContent = oui ? '⏸ Pause' : '▶ Lecture';
    if (oui && !boucle) { avant = performance.now(); boucle = requestAnimationFrame(image); }
  }

  // tout recommence à t = 0 (changement de réglage, Recommencer)
  function zero() {
    etat.t = 0; etat.demo = null;
    rendre();
  }

  // ---------- Graphes SVG ----------
  // pas de graduation pour qu'elles soient espacées d'au moins 36 px
  function pasGrad(etendue, px) {
    for (const p of [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5]) if (p / etendue * px >= 36) return p;
    return 10;
  }
  const decimales = p => p < 0.1 ? 2 : p === 0.25 ? 2 : p < 1 ? 1 : 0;
  const n2 = v => v.toFixed(1);
  // flèche double horizontale de x1 à x2 à la hauteur h
  function fleche(x1, x2, h) {
    if (x2 - x1 < 2) return '';
    const p = Math.min(7, (x2 - x1) / 2);
    return `<line class="dp-fleche" x1="${n2(x1 + 1)}" y1="${n2(h)}" x2="${n2(x2 - 1)}" y2="${n2(h)}"/>` +
      `<path class="dp-fleche-p" d="M${n2(x1)} ${n2(h)}l${n2(p)} -4v8z"/>` +
      `<path class="dp-fleche-p" d="M${n2(x2)} ${n2(h)}l${n2(-p)} -4v8z"/>`;
  }
  // période (λ ou T) entre deux crêtes d'abscisses x1 et x2 (yCrete : hauteur des crêtes) :
  // traits de rappel au-dessus des crêtes, double flèche et étiquette au-dessus
  function periode(x1, x2, yCrete, texte) {
    const h = yCrete - 9;
    return `<line class="dp-per-rappel" x1="${n2(x1)}" y1="${n2(yCrete - 3)}" x2="${n2(x1)}" y2="${n2(h - 5)}"/>` +
      `<line class="dp-per-rappel" x1="${n2(x2)}" y1="${n2(yCrete - 3)}" x2="${n2(x2)}" y2="${n2(h - 5)}"/>` +
      fleche(x1, x2, h) +
      `<text class="dp-per-t" x="${n2((x1 + x2) / 2)}" y="${n2(h - 5)}">${texte}</text>`;
  }
  const svg = (W, H, label, corps) =>
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${corps}</svg>`;

  // --- périodicité spatiale : y(x) de E (x = 0) à λ après R (x = D + λ) ---
  function dessinerEspace() {
    const W = zEsp.clientWidth, H = zEsp.clientHeight;
    if (!W || !H) return;
    const m = { g: 64, d: 52, h: 30, b: 26 };
    const pw = W - m.g - m.d, ph = H - m.h - m.b, Lm = L();
    const X = x => m.g + x / Lm * pw, yc = m.h + ph / 2, A = ph * 0.36, Y = v => yc - v * A;
    const t = etat.t, l = lam();
    let s = '';
    // grille et graduations en mètres
    const p = pasGrad(Lm, pw), dec = decimales(p);
    for (let k = 0; k * p <= Lm + 1e-9; k++) {
      const x = X(k * p);
      s += `<line class="dp-grille" x1="${n2(x)}" y1="${m.h}" x2="${n2(x)}" y2="${n2(m.h + ph)}"/>` +
        `<text class="dp-grad" x="${n2(x)}" y="${n2(m.h + ph + 17)}">${fixe(k * p, dec)}</text>`;
    }
    [-1, 1].forEach(v => { s += `<line class="dp-grille" x1="${m.g}" y1="${n2(Y(v))}" x2="${n2(m.g + pw)}" y2="${n2(Y(v))}"/>`; });
    s += `<text class="dp-nom-axe" x="${n2(m.g + pw + 20)}" y="${n2(m.h + ph + 17)}">x (m)</text>`;
    // démonstration : bande parcourue par la crête suivie
    const d = etat.demo;
    let demoDessus = '';
    if (d && d.phase !== 'attente') {
      const x1 = D, xc = Math.min(Lm, x1 + etat.c * (t - d.t1));     // la crête part de R
      s += `<rect class="dp-bande" x="${n2(X(x1))}" y="${m.h}" width="${n2(X(xc) - X(x1))}" height="${n2(ph)}"/>`;
      const hF = m.h + ph - 12;
      const txt = d.phase === 'fin' ? (etat.masque ? 'λ' : 'λ = ' + fmt(l) + NB + 'm') : 'distance parcourue';
      demoDessus = fleche(X(x1), X(xc), hF) +
        (X(xc) - X(x1) > txt.length * 7.5 + 10 || d.phase === 'fin' ? `<text class="dp-fleche-t" x="${n2((X(x1) + X(xc)) / 2)}" y="${n2(hF - 7)}">${txt}</text>` : '') +
        `<circle class="dp-depart" cx="${n2(X(x1))}" cy="${n2(Y(1))}" r="6"/>` +
        `<circle class="dp-marque" cx="${n2(X(xc))}" cy="${n2(Y(y(xc, t)))}" r="7"/>`;
    }
    // axe et onde
    s += `<line class="dp-axe" x1="${m.g}" y1="${n2(yc)}" x2="${n2(m.g + pw)}" y2="${n2(yc)}"/>`;
    // récepteur R, dans le milieu à x = D, sur l'axe comme E : trait vertical et étiquette (l'onde passe devant)
    s += `<line class="dp-recepteur" x1="${n2(X(D))}" y1="${m.h}" x2="${n2(X(D))}" y2="${n2(m.h + ph)}"/>` +
      `<rect class="dp-boite" x="${n2(X(D) - 14)}" y="${n2(yc - 12)}" width="28" height="24" rx="6"/>` +
      `<text class="dp-boite-t dp-boite-pt" x="${n2(X(D))}" y="${n2(yc + 5)}">R</text>`;
    let chemin = '';
    for (let i = 0; i <= pw; i++) {
      const x = i / pw * Lm;
      chemin += (i ? 'L' : 'M') + n2(m.g + i) + ' ' + n2(Y(y(x, t)));
    }
    s += `<path class="dp-courbe" d="${chemin}"/>`;
    // front de l'onde, tant qu'il n'a pas atteint le bout du milieu représenté
    const xf = etat.c * t;
    if (t > 0 && xf < Lm) {
      const gauche = X(xf) > m.g + pw - 50;
      s += `<line class="dp-front" x1="${n2(X(xf))}" y1="${m.h}" x2="${n2(X(xf))}" y2="${n2(m.h + ph)}"/>` +
        `<text class="dp-front-t" x="${n2(X(xf) + (gauche ? -5 : 5))}" y="${n2(m.h + 13)}" text-anchor="${gauche ? 'end' : 'start'}">front</text>`;
    }
    s += demoDessus;
    // période spatiale : crêtes à x = c·t − λ(uC + k), k ≥ 0 (k = 0 : crête la plus proche du front) ;
    // on prend les deux crêtes voisines les plus à droite entièrement dans le milieu représenté
    if (etat.periodes) {
      const uC = MOTIF[etat.forme].uCrete, xf = etat.c * t;
      const k = Math.max(1, Math.ceil((xf - Lm) / l - uC - 1e-9) + 1);
      const xa = xf - l * (uC + k), xb = xa + l;
      if (xa >= -1e-9) s += periode(X(xa), X(xb), Y(1), 'λ');
    }
    // point du milieu au niveau de R
    s += `<circle class="dp-point" cx="${n2(X(D))}" cy="${n2(Y(y(D, t)))}" r="5"/>`;
    // émetteur
    const hb = Math.min(46, ph * 0.5);
    s += `<rect class="dp-boite" x="${m.g - 46}" y="${n2(yc - hb / 2)}" width="40" height="${n2(hb)}" rx="8"/>` +
      `<text class="dp-boite-t" x="${m.g - 26}" y="${n2(yc + 6)}">E</text>` +
      `<text class="dp-legende" x="${m.g - 26}" y="${n2(yc + hb / 2 + 14)}">émetteur</text>`;
    zEsp.innerHTML = svg(W, H, `Onde à l'instant t, de l'émetteur jusqu'à une longueur d'onde après le récepteur, placé à ${D}${NB}m`, s);
  }

  // --- périodicité temporelle : signal reçu par R en fonction de t ---
  function dessinerTemps() {
    const W = zTps.clientWidth, H = zTps.clientHeight;
    if (!W || !H) return;
    const m = { g: 64, d: 56, h: 30, b: 26 };
    const pw = W - m.g - m.d, ph = H - m.h - m.b;
    const t = etat.t, per = T();
    const Lt = t0() + 4 * per;                          // durée affichée : arrivée de l'onde + 4 périodes
    const deb = Math.max(0, t - Lt);                     // au-delà, la fenêtre défile
    const X = u => m.g + (u - deb) / Lt * pw, yc = m.h + ph / 2, A = ph * 0.4, Y = v => yc - v * A;
    let s = '';
    // grille et graduations en secondes
    const p = pasGrad(Lt, pw), dec = decimales(p);
    for (let k = Math.ceil(deb / p - 1e-9); k * p <= deb + Lt + 1e-9; k++) {
      const x = X(k * p);
      s += `<line class="dp-grille" x1="${n2(x)}" y1="${m.h}" x2="${n2(x)}" y2="${n2(m.h + ph)}"/>` +
        `<text class="dp-grad" x="${n2(x)}" y="${n2(m.h + ph + 17)}">${fixe(k * p, dec)}</text>`;
    }
    [-1, 1].forEach(v => { s += `<line class="dp-grille" x1="${m.g}" y1="${n2(Y(v))}" x2="${n2(m.g + pw)}" y2="${n2(Y(v))}"/>`; });
    s += `<text class="dp-nom-axe" x="${n2(m.g + pw + 20)}" y="${n2(m.h + ph + 17)}">t (s)</text>`;
    // démonstration : durée écoulée pendant le suivi de la crête
    const d = etat.demo;
    let demoDessus = '';
    if (d && d.phase !== 'attente') {
      const ta = Math.max(deb, d.t1), tb = Math.min(t, d.t1 + per);
      s += `<rect class="dp-bande" x="${n2(X(ta))}" y="${m.h}" width="${n2(Math.max(0, X(tb) - X(ta)))}" height="${n2(ph)}"/>`;
      const hF = m.h + ph - 12;
      const txt = d.phase === 'fin' ? (etat.masque ? 'T' : 'T = ' + fmt(per) + NB + 's') : 'durée écoulée';
      demoDessus = fleche(X(ta), X(tb), hF) +
        (X(tb) - X(ta) > txt.length * 7.5 + 10 || d.phase === 'fin' ? `<text class="dp-fleche-t" x="${n2((X(ta) + X(tb)) / 2)}" y="${n2(hF - 7)}">${txt}</text>` : '') +
        (d.t1 >= deb ? `<circle class="dp-depart" cx="${n2(X(d.t1))}" cy="${n2(Y(1))}" r="6"/>` : '') +
        (d.phase === 'fin' ? `<circle class="dp-marque" cx="${n2(X(d.t1 + per))}" cy="${n2(Y(1))}" r="7"/>` : '');
    }
    // axe et signal reçu, de deb à t
    s += `<line class="dp-axe" x1="${m.g}" y1="${n2(yc)}" x2="${n2(m.g + pw)}" y2="${n2(yc)}"/>`;
    const fin = X(t) - m.g;
    if (fin > 0) {
      let chemin = '';
      for (let i = 0; i <= fin; i++) {
        const u = deb + i / pw * Lt;
        chemin += (i ? 'L' : 'M') + n2(m.g + i) + ' ' + n2(Y(y(D, u)));
      }
      chemin += 'L' + n2(X(t)) + ' ' + n2(Y(y(D, t)));
      s += `<path class="dp-courbe" d="${chemin}"/>`;
    }
    s += demoDessus;
    // période temporelle : crêtes reçues aux instants t0 + (uC + k) / f, k ≥ 0 ;
    // on prend les deux crêtes voisines les plus à gauche encore sur le papier : la flèche part avec lui vers la gauche
    if (etat.periodes) {
      const uC = MOTIF[etat.forme].uCrete;
      const k = Math.max(0, Math.ceil((deb - t0()) / per - uC - 1e-9));
      const ta = t0() + (uC + k) * per, tb = ta + per;
      if (tb <= t + 1e-9) s += periode(X(ta), X(tb), Y(1), 'T');
    }
    s += `<circle class="dp-point" cx="${n2(X(t))}" cy="${n2(Y(y(D, t)))}" r="5"/>`;
    // récepteur, à gauche de l'axe
    const hb = Math.min(46, ph * 0.5);
    s += `<rect class="dp-boite" x="${m.g - 46}" y="${n2(yc - hb / 2)}" width="40" height="${n2(hb)}" rx="8"/>` +
      `<text class="dp-boite-t" x="${m.g - 26}" y="${n2(yc + 6)}">R</text>` +
      `<text class="dp-legende" x="${m.g - 26}" y="${n2(yc + hb / 2 + 14)}">signal reçu</text>`;
    zTps.innerHTML = svg(W, H, 'Signal reçu par le récepteur en fonction du temps', s);
  }

  // ---------- Panneau : valeurs et message ----------
  let dernierMsg = '';
  function panneau() {
    $('dp-t').textContent = 't = ' + fixe(etat.t, 2) + NB + 's';
    $('dp-vf').textContent = 'f = ' + fixe(etat.f, 1) + NB + 'Hz';
    $('dp-vc').innerHTML = 'c = ' + fixe(etat.c, 1) + NB + UC;
    $('dp-vT').innerHTML = etat.masque ? '<span class="dp-cache">?</span>' : fmt(T()) + NB + 's';
    $('dp-vl').innerHTML = etat.masque ? '<span class="dp-cache">?</span>' : fmt(lam()) + NB + 'm';
    const d = etat.demo;
    bSuivre.disabled = !!d && d.phase !== 'fin';
    let h, classe = '';
    if (!d) {
      h = `<p>Le front de l'onde avance à la célérité c. L'onde se répète dans l'espace (période spatiale <b>λ</b>, en haut) et dans le temps (période temporelle <b>T</b>, en bas).</p>`;
    } else if (d.phase === 'attente') {
      h = etat.t < t0()
        ? `<p>On attend que l'onde arrive au récepteur R…</p>`
        : `<p>On attend qu'une crête arrive en R…</p>`;
    } else if (d.phase === 'suivi') {
      const dt = etat.t - d.t1;
      h = etat.masque
        ? `<p>La crête marquée part de R et avance pendant une période T…</p>`
        : `<p>La crête marquée part de R et avance…</p><p class="dp-calc">Durée écoulée : ${fixe(dt, 2)}${NB}s · distance parcourue : ${fixe(etat.c * dt, 2)}${NB}m</p>`;
    } else {
      classe = 'dp-fin';
      h = etat.masque
        ? `<p>Pendant une période <b>T</b>, la crête marquée a parcouru une longueur d'onde <b>λ</b>.</p>` +
          `<p>Vitesse = distance / durée : <span class="dp-calc">c = λ / T</span>, donc <span class="dp-calc">λ = c × T = c / f</span>.</p>`
        : `<p>Pendant une période T = ${fmt(T())}${NB}s, la crête marquée a parcouru ${fmt(lam())}${NB}m : c'est une longueur d'onde <b>λ</b>.</p>` +
          `<p>Vitesse = distance / durée :<br><span class="dp-calc">c = λ / T = ${fmt(lam())} / ${fmt(T())} = ${fmt(lam() / T())}${NB}${UC}</span></p>` +
          `<p>Comme T = 1 / f : <span class="dp-calc">λ = c × T = c / f</span>.</p>`;
    }
    if (h + classe !== dernierMsg) {
      msg.innerHTML = h; msg.className = 'dp-message ' + classe; dernierMsg = h + classe;
      // ordinateur : si le panneau défile, on y amène le message (jamais besoin de le faire défiler soi-même)
      const pan = msg.closest('.dp-panneau');
      if (d && matchMedia('(min-width: 900px)').matches && pan.scrollHeight > pan.clientHeight) pan.scrollTop = pan.scrollHeight;
    }
  }

  function rendre() { dessinerEspace(); dessinerTemps(); panneau(); }

  // ---------- Démonstration « Suivre l'onde pendant T » ----------
  // t1 : prochain instant (onde arrivée en R) où une crête est en R ;
  // cette crête est suivie de x = D à x = D + λ
  function suivre() {
    const uC = MOTIF[etat.forme].uCrete, f = etat.f;
    const tb = Math.max(etat.t, t0());
    const k = Math.ceil((tb - t0()) * f - uC - 1e-9);
    etat.demo = { phase: 'attente', t1: t0() + (k + uC) / f };
    if (etat.demo.t1 - etat.t < 1e-9) etat.demo.phase = 'suivi';
    lecture(true);
    rendre();
  }

  // ---------- Commandes ----------
  function choisir(groupe, bouton) {
    groupe.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === bouton));
  }
  document.querySelectorAll('[data-forme]').forEach(b => b.addEventListener('click', () => {
    choisir(b.parentNode, b); etat.forme = b.dataset.forme; zero();
  }));
  document.querySelectorAll('[data-vitesse]').forEach(b => b.addEventListener('click', () => {
    choisir(b.parentNode, b); etat.vitesse = Number(b.dataset.vitesse);
  }));
  $('dp-f').addEventListener('input', e => { etat.f = Number(e.target.value); zero(); });
  $('dp-c').addEventListener('input', e => { etat.c = Number(e.target.value); zero(); });
  bLecture.addEventListener('click', () => {
    if (!etat.lecture && etat.demo && etat.demo.phase === 'fin') etat.demo = null;   // on repart sans la démonstration
    lecture(!etat.lecture);
    rendre();
  });
  $('dp-pas').addEventListener('click', () => {
    lecture(false);
    if (etat.demo && etat.demo.phase === 'fin') etat.demo = null;
    avancer(T() / 20);
    rendre();
  });
  $('dp-zero').addEventListener('click', zero);
  bSuivre.addEventListener('click', () => {
    if (etat.demo && etat.demo.phase === 'fin') etat.demo = null;
    suivre();
  });
  bPeriodes.addEventListener('click', () => {
    etat.periodes = !etat.periodes;
    bPeriodes.setAttribute('aria-pressed', etat.periodes);
    bPeriodes.textContent = etat.periodes ? 'Masquer les périodes' : 'Afficher les périodes';
    rendre();
  });
  bMasquer.addEventListener('click', () => {
    etat.masque = !etat.masque;
    bMasquer.setAttribute('aria-pressed', etat.masque);
    bMasquer.textContent = etat.masque ? 'Afficher les valeurs' : 'Masquer les valeurs';
    rendre();
  });

  // ---------- Navigation et plein écran ----------
  SOM.init({ nom: 'Double périodicité d\'une onde', id: 'double-periodicite', plan: [] });
  SOM.menu('accueil');
  const racine = document.documentElement;
  const demander = racine.requestFullscreen || racine.webkitRequestFullscreen;
  const enPlein = () => document.fullscreenElement || document.webkitFullscreenElement;
  if (demander && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-small dp-plein';
    const maj = () => {
      const oui = !!enPlein();
      b.innerHTML = (oui
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>') +
        `<span class="dp-plein-t">${oui ? 'Quitter le plein écran' : 'Plein écran'}</span>`;
      b.setAttribute('aria-label', oui ? 'Quitter le plein écran' : 'Plein écran');
    };
    b.addEventListener('click', () => {
      try {
        const r = enPlein() ? (document.exitFullscreen || document.webkitExitFullscreen).call(document) : demander.call(racine);
        if (r && r.catch) r.catch(() => {});
      } catch (e) { /* plein écran refusé : rien à faire */ }
    });
    document.addEventListener('fullscreenchange', maj);
    document.addEventListener('webkitfullscreenchange', maj);
    maj();
    const barre = document.querySelector('.app-topbar');
    if (barre) barre.appendChild(b);
  }

  // ---------- Illustrations de mise en situation ----------
  // chemin d'une sinusoïde de x0 à x1 : centre yc, amplitude a, période p, plate avant xd
  function sinus(x0, x1, yc, a, p, xd) {
    let c = '';
    for (let x = x0; x <= x1 + 1e-9; x += 1) {
      const v = x < xd ? 0 : Math.sin(2 * Math.PI * (x - xd) / p);
      c += (c ? 'L' : 'M') + n2(x) + ' ' + n2(yc - a * v);
    }
    return c;
  }
  function illustrations() {
    // en haut : une caméra filme l'onde, l'image montre tout le milieu à un instant
    $('dp-situ-film').innerHTML = '<svg viewBox="0 0 140 104" role="img" aria-label="Une caméra filme l\'onde : une image montre tout le milieu à un instant">' +
      '<line class="dp-s-champ" x1="60" y1="31" x2="7" y2="53"/><line class="dp-s-champ" x1="72" y1="31" x2="133" y2="53"/>' +
      '<rect class="dp-s-corps" x="46" y="7" width="40" height="25" rx="5"/><rect class="dp-s-corps" x="51" y="2" width="13" height="7" rx="2"/>' +
      '<circle class="dp-s-objectif" cx="66" cy="19.5" r="8"/><circle class="dp-s-lentille" cx="66" cy="19.5" r="3"/><circle class="dp-s-lentille" cx="80" cy="12" r="2"/>' +
      '<rect class="dp-s-cadre" x="6" y="53" width="128" height="46" rx="4"/>' +
      '<rect class="dp-s-boite" x="10" y="68" width="10" height="16" rx="2"/>' +
      `<path class="dp-s-onde" d="${sinus(20, 130, 76, 12, 30, 20)}"/>` +
      '<line class="dp-s-r" x1="100" y1="62" x2="100" y2="95"/><text class="dp-s-txt" x="15" y="64">E</text><text class="dp-s-txt" x="107" y="63">R</text></svg>';
    // en bas : un stylo relié à R suit le signal sur un papier qui défile (sismographe)
    const yp = 65 - 14 * Math.sin(2 * Math.PI * 56 / 26);   // position de la pointe sur la courbe (x = 96)
    $('dp-situ-papier').innerHTML = '<svg viewBox="0 0 140 112" role="img" aria-label="Un stylo relié au récepteur trace le signal sur un papier qui défile">' +
      '<rect class="dp-s-papier" x="6" y="42" width="114" height="46"/><line class="dp-s-champ" x1="6" y1="65" x2="120" y2="65"/>' +
      `<path class="dp-s-onde" d="${sinus(8, 96, 65, 14, 26, 40)}"/>` +
      '<rect class="dp-s-rouleau" x="0" y="38" width="9" height="54" rx="4.5"/><rect class="dp-s-rouleau" x="117" y="38" width="9" height="54" rx="4.5"/>' +
      `<line class="dp-s-stylo" x1="114" y1="25" x2="99" y2="${n2(yp - 5)}"/>` +
      `<path class="dp-s-pointe" d="M96 ${n2(yp)}l0.5 -7l5 3.5z"/>` +
      '<rect class="dp-s-boite" x="104" y="4" width="32" height="22" rx="5"/><text class="dp-s-txt dp-s-gros" x="120" y="19.5">R</text>' +
      '<line class="dp-s-fl" x1="104" y1="98" x2="34" y2="98"/><path class="dp-s-fl-p" d="M28 98l8 -4v8z"/>' +
      '<text class="dp-s-leg" x="66" y="110">le papier défile</text></svg>';
  }

  // ---------- Démarrage ----------
  // redessin à chaque changement de taille (fenêtre, plein écran, rotation)
  if (window.ResizeObserver) new ResizeObserver(() => { if (!etat.lecture) rendre(); }).observe(zEsp);
  else window.addEventListener('resize', () => { if (!etat.lecture) rendre(); });
  illustrations();
  rendre();

  return { etat };
})();
