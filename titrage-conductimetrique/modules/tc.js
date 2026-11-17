/* ============================================================
   Titrage conductimétrique : animation des ions (espace de noms TC)

   TC.TITRAGES                 les quatre titrages (acide éthanoïque, acide nitrique, ammoniac, ions chlorure)
   TC.ESPECES                  espèces : écriture, λ (mS·m²·mol⁻¹), classe de couleur
   TC.creer(zone, o)           page complète : montage + loupe + commandes + guide | courbe + loi + tableau
     o = { titrage: 'ethanoique', mode: 'demo' | 'toi', surChangement(etat), surFin(id) }
     → { choisir(id), mode(m), recommencer() }

   Modèle (dilution négligée, réaction totale 1 : 1) :
     chaque ajout de 2 mL apporte une « pastille » de chaque ion de la burette ;
     le bécher contient au départ V_E / 2 pastilles de l'espèce titrée ;
     σ = k × Σ λ × n (n : quantité en « mL de solution titrante », k fixé par les concentrations).
   Rôles des espèces dans un titrage :
     specT  ion spectateur de la burette     (Na⁺, Cl⁻, NO₃⁻)
     reacT  ion de la burette qui réagit      (HO⁻, H₃O⁺, Ag⁺)
     reacB  espèce titrée, dans le bécher     (CH₃COOH, H₃O⁺, NH₃, Cl⁻)
     specB  ion spectateur du bécher          (NO₃⁻ de l'acide nitrique, Na⁺ du sérum physiologique)
     prod   produit                           (CH₃COO⁻, NH₄⁺, AgCl solide ; aucun pour H₃O⁺ + HO⁻)
   Couleurs : classes tc-c-* (variables --ion-* du thème), jamais de couleur dans ce fichier.
   ============================================================ */
(function () {
  'use strict';
  const NB = ' ';

  /* ---------- espèces : une couleur par ion, la molécule a la couleur de l'ion qu'elle donne ---------- */
  const ESPECES = {
    'Na+':     { html: 'Na<sup>+</sup>', lambda: 5.0, l: '5,0', c: 'na' },
    'HO-':     { html: 'HO<sup>−</sup>', lambda: 20, l: '20', c: 'ho' },
    'H3O+':    { html: 'H<sub>3</sub>O<sup>+</sup>', lambda: 35, l: '35', c: 'h3o' },
    'Cl-':     { html: 'Cl<sup>−</sup>', lambda: 7.6, l: '7,6', c: 'cl' },
    'NO3-':    { html: 'NO<sub>3</sub><sup>−</sup>', lambda: 7.1, l: '7,1', c: 'no3' },
    'Ag+':     { html: 'Ag<sup>+</sup>', lambda: 6.19, l: '6,19', c: 'ag' },
    'CH3COO-': { html: 'CH<sub>3</sub>COO<sup>−</sup>', lambda: 4.1, l: '4,1', c: 'ac' },
    'NH4+':    { html: 'NH<sub>4</sub><sup>+</sup>', lambda: 7.4, l: '7,4', c: 'nh4' },
    'CH3COOH': { html: 'CH<sub>3</sub>COOH', molecule: true, c: 'ac' },
    'NH3':     { html: 'NH<sub>3</sub>', molecule: true, c: 'nh4' },
    'AgCl':    { html: 'AgCl', solide: true, c: 'agcl' },
    'H2O':     { html: 'H<sub>2</sub>O', molecule: true, c: 'eau' },
  };
  const h = id => ESPECES[id].html;
  const PAS = 2;                 // mL versés à chaque ajout ; 1 pastille = quantité apportée par PAS mL

  /* ---------- les titrages ----------
     k : σ (dans l'unité du graphique) = k × Σ λ N ; y : axe des ordonnées du graphique. */
  const TITRAGES = [
    { id: 'ethanoique', bouton: 'Acide éthanoïque · soude',
      titre: 'Titrage de l’acide éthanoïque par la soude',
      burette: { texte: ['Na⁺ + HO⁻', 'soude'], nom: 'soude (Na<sup>+</sup> + HO<sup>−</sup>)' },
      becher: { texte: ['CH_{3}COOH', 'acide éthanoïque'], nom: 'acide éthanoïque CH<sub>3</sub>COOH' },
      roles: { specT: 'Na+', reacT: 'HO-', reacB: 'CH3COOH', prod: 'CH3COO-' },
      equation: ['CH3COOH', '+', 'HO-', '→', 'CH3COO-', '+', 'H2O'],
      ve: 10, vMax: 20, k: 0.5, unite: 'mS·m⁻¹', y: { min: 0, max: 180, pas: 20 }, dec: 0,
      justif: {
        q: 'Pourquoi la pente est-elle plus forte après l’équivalence ?',
        choix: [
          { html: `Après l’équivalence, les HO<sup>−</sup> versés s’accumulent au lieu d’être remplacés par des CH<sub>3</sub>COO<sup>−</sup>, et λ(HO<sup>−</sup>) = 20 > λ(CH<sub>3</sub>COO<sup>−</sup>) = 4,1.`, juste: true },
          { html: 'Après l’équivalence, les Na<sup>+</sup> versés s’accumulent plus vite.',
            diag: 'Les Na<sup>+</sup> s’accumulent de la même façon avant et après l’équivalence : ce ne sont pas eux qui changent la pente.' },
          { html: 'Après l’équivalence, la réaction forme plus d’ions CH<sub>3</sub>COO<sup>−</sup>.',
            diag: 'Après l’équivalence, il n’y a plus de CH<sub>3</sub>COOH : plus aucun CH<sub>3</sub>COO<sup>−</sup> n’est formé (regarde la loupe).' },
        ],
        texte: `Avant l’équivalence, σ est croissante : Na<sup>+</sup> et CH<sub>3</sub>COO<sup>−</sup> s’accumulent (coefficient directeur ∝ 5,0 + 4,1 = 9,1).<br>
          Après l’équivalence, σ est croissante avec une pente plus élevée (∝ 5,0 + 20 = 25) car λ(HO<sup>−</sup>) > λ(CH<sub>3</sub>COO<sup>−</sup>).`,
      } },
    { id: 'nitrique', bouton: 'Acide nitrique · soude',
      titre: 'Titrage de l’acide nitrique par la soude',
      burette: { texte: ['Na⁺ + HO⁻', 'c = 0,20 mol·L⁻¹'], nom: 'soude (Na<sup>+</sup> + HO<sup>−</sup>)' },
      becher: { texte: ['H_{3}O⁺ + NO_{3}⁻', 'V = 200 mL'], nom: 'acide nitrique (H<sub>3</sub>O<sup>+</sup> + NO<sub>3</sub><sup>−</sup>)' },
      roles: { specT: 'Na+', reacT: 'HO-', reacB: 'H3O+', specB: 'NO3-' },
      equation: ['H3O+', '+', 'HO-', '→', '2', 'H2O'],
      ve: 10, vMax: 20, k: 0.001, unite: 'S·m⁻¹', y: { min: 0, max: 0.45, pas: 0.05 }, dec: 3,
      justif: {
        q: 'Pourquoi σ diminue-t-elle avant l’équivalence, puis augmente-t-elle ?',
        choix: [
          { html: `Avant l’équivalence, chaque H<sub>3</sub>O<sup>+</sup> consommé (λ = 35) est remplacé par un Na<sup>+</sup> (λ = 5,0) : σ diminue. Après, Na<sup>+</sup> et HO<sup>−</sup> s’accumulent : σ augmente.`, juste: true },
          { html: 'Avant l’équivalence, σ diminue car on dilue la solution en versant la soude.',
            diag: 'Avec 200 mL dans le bécher, la dilution est négligeable : c’est le remplacement de H<sub>3</sub>O<sup>+</sup> par Na<sup>+</sup> qui fait baisser σ.' },
          { html: 'Avant l’équivalence, σ diminue car les HO<sup>−</sup> versés conduisent mal le courant.',
            diag: 'Avant l’équivalence, les HO<sup>−</sup> disparaissent aussitôt : ils ne comptent pas. Compare plutôt λ(H<sub>3</sub>O<sup>+</sup>) et λ(Na<sup>+</sup>).' },
        ],
        texte: `Avant l’équivalence, σ est décroissante : chaque H<sub>3</sub>O<sup>+</sup> consommé est remplacé par un Na<sup>+</sup> et λ(Na<sup>+</sup>) < λ(H<sub>3</sub>O<sup>+</sup>) (coefficient directeur ∝ 5,0 − 35 = −30).<br>
          Après l’équivalence, σ est croissante : Na<sup>+</sup> et HO<sup>−</sup> s’accumulent (∝ 5,0 + 20 = 25).`,
      } },
    { id: 'ammoniac', bouton: 'Ammoniac · acide chlorhydrique',
      titre: 'Titrage de l’ammoniac par l’acide chlorhydrique',
      burette: { texte: ['H_{3}O⁺ + Cl⁻', 'acide chlorhydrique'], nom: 'acide chlorhydrique (H<sub>3</sub>O<sup>+</sup> + Cl<sup>−</sup>)' },
      becher: { texte: ['NH_{3}', 'V = 200 mL'], nom: 'ammoniac NH<sub>3</sub>' },
      roles: { specT: 'Cl-', reacT: 'H3O+', reacB: 'NH3', prod: 'NH4+' },
      equation: ['NH3', '+', 'H3O+', '→', 'NH4+', '+', 'H2O'],
      ve: 10, vMax: 20, k: 0.001, unite: 'S·m⁻¹', y: { min: 0, max: 0.6, pas: 0.1 }, dec: 3,
      justif: {
        q: 'Pourquoi la pente est-elle plus forte après l’équivalence ?',
        choix: [
          { html: `Après l’équivalence, les H<sub>3</sub>O<sup>+</sup> versés s’accumulent au lieu d’être remplacés par des NH<sub>4</sub><sup>+</sup>, et λ(H<sub>3</sub>O<sup>+</sup>) = 35 > λ(NH<sub>4</sub><sup>+</sup>) = 7,4.`, juste: true },
          { html: 'Après l’équivalence, les Cl<sup>−</sup> versés s’accumulent plus vite.',
            diag: 'Les Cl<sup>−</sup> s’accumulent de la même façon avant et après l’équivalence : ce ne sont pas eux qui changent la pente.' },
          { html: 'Après l’équivalence, les molécules NH<sub>3</sub> conduisent mieux le courant.',
            diag: 'NH<sub>3</sub> est une molécule : elle ne porte pas de charge et n’apparaît pas dans la loi de Kohlrausch. Après l’équivalence, il n’en reste d’ailleurs plus.' },
        ],
        texte: `Avant l’équivalence, σ est croissante : Cl<sup>−</sup> et NH<sub>4</sub><sup>+</sup> s’accumulent (coefficient directeur ∝ 7,6 + 7,4 = 15).<br>
          Après l’équivalence, σ est croissante avec une pente plus élevée (∝ 7,6 + 35 = 42,6) car λ(H<sub>3</sub>O<sup>+</sup>) > λ(NH<sub>4</sub><sup>+</sup>).`,
      } },
    { id: 'chlorure', bouton: 'Ions chlorure · nitrate d’argent',
      titre: 'Titrage des ions chlorures d’un sérum physiologique (Na<sup>+</sup>, Cl<sup>−</sup>) par le nitrate d’argent',
      burette: { texte: ['Ag⁺ + NO_{3}⁻', 'c = 20 mmol·L⁻¹'], nom: 'nitrate d’argent (Ag<sup>+</sup> + NO<sub>3</sub><sup>−</sup>)' },
      becher: { texte: ['Na⁺ + Cl⁻ (sérum)', '+ 200 mL d’eau'], nom: 'sérum physiologique (Na<sup>+</sup> + Cl<sup>−</sup>)' },
      roles: { specT: 'NO3-', reacT: 'Ag+', reacB: 'Cl-', specB: 'Na+', prod: 'AgCl' },
      equation: ['Ag+', '+', 'Na+', '+', 'Cl-', '→', 'AgCl', '+', 'Na+'],
      ve: 10, vMax: 20, k: 1 / 11, unite: 'mS·m⁻¹', y: { min: 0, max: 24, pas: 2 }, dec: 2,
      justif: {
        q: 'Pourquoi σ diminue-t-elle légèrement avant l’équivalence, puis augmente-t-elle nettement ?',
        choix: [
          { html: `Avant l’équivalence, chaque Cl<sup>−</sup> précipité (λ = 7,6) est remplacé par un NO<sub>3</sub><sup>−</sup> (λ = 7,1) : σ diminue un peu. Après, Ag<sup>+</sup> et NO<sub>3</sub><sup>−</sup> s’accumulent : σ augmente.`, juste: true },
          { html: 'Avant l’équivalence, σ diminue car le précipité AgCl conduit moins bien le courant.',
            diag: 'AgCl est un solide : il ne conduit pas le courant et n’apparaît pas dans la loi de Kohlrausch.' },
          { html: 'Avant l’équivalence, σ diminue car les ions Ag<sup>+</sup> disparaissent de la solution.',
            diag: '[Ag<sup>+</sup>] reste nulle avant l’équivalence : elle ne change pas. C’est Cl<sup>−</sup> qui est remplacé par NO<sub>3</sub><sup>−</sup>.' },
        ],
        texte: `Avant l’équivalence, σ est légèrement décroissante : chaque Cl<sup>−</sup> précipité est remplacé par un NO<sub>3</sub><sup>−</sup> et λ(NO<sub>3</sub><sup>−</sup>) < λ(Cl<sup>−</sup>) (coefficient directeur ∝ 7,1 − 7,6 = −0,5).<br>
          Après l’équivalence, σ est croissante : Ag<sup>+</sup> et NO<sub>3</sub><sup>−</sup> s’accumulent (∝ 7,1 + 6,19 = 13,29).`,
      } },
  ];

  /* ---------- nombres à la française ---------- */
  function fmt(x, dec) {
    const s = (Math.abs(x) < 1e-9 ? 0 : x).toFixed(dec == null ? 2 : dec);
    return s.replace('.', ',').replace('-', '−');
  }
  // nombre court : 9,1 ; 25 ; −0,5 ; 13,29
  const court = x => fmt(x, Math.round(x * 100) % 10 ? 2 : Math.round(x * 10) % 10 ? 1 : 0);

  /* ---------- modèle : nombre de pastilles de chaque espèce pour V mL versés ---------- */
  function compter(t, V) {
    const r = t.roles, x = Math.min(V, t.ve), n = {};
    n[r.specT] = V;
    n[r.reacT] = V - x;
    n[r.reacB] = t.ve - x;
    if (r.specB) n[r.specB] = t.ve;
    if (r.prod) n[r.prod] = x;
    return n;
  }
  function sigma(t, V) {
    const n = compter(t, V);
    let s = 0;
    for (const e in n) if (ESPECES[e].lambda) s += ESPECES[e].lambda * n[e];
    return s * t.k;
  }
  // ions du tableau (lignes), dans l'ordre : burette, bécher, produit
  function ionsTableau(t) {
    const r = t.roles;
    return [r.specT, r.reacT, r.reacB, r.specB, r.prod].filter(e => e && !ESPECES[e].molecule && !ESPECES[e].solide);
  }
  function role(t, e) { for (const k in t.roles) if (t.roles[k] === e) return k; return null; }

  /* ---------- évolution attendue de chaque concentration, avec l'explication ---------- */
  const EVOS = {
    plus: { sym: '↗', nom: 'augmente' }, moins: { sym: '↘', nom: 'diminue' },
    cste: { sym: '=', nom: 'constante', txt: 'constante' }, nulle: { sym: '0', nom: 'reste nulle' },
  };
  function evolution(t, e, phase) {
    const ro = role(t, e), r = t.roles, nomB = h(r.reacB), nomT = h(r.reacT);
    const avant = phase === 'avant';
    if (ro === 'specT') return { v: 'plus', txt: `les ${h(e)} versés ne réagissent pas : ils s’accumulent dans le bécher.` };
    if (ro === 'reacT') return avant
      ? { v: 'nulle', txt: `chaque ${h(e)} versé réagit aussitôt avec ${nomB} : il n’en reste aucun dans le bécher.` }
      : { v: 'plus', txt: `il n’y a plus de ${nomB} : les ${h(e)} versés ne réagissent plus et s’accumulent.` };
    if (ro === 'reacB') return avant
      ? { v: 'moins', txt: `les ${h(e)} du bécher sont consommés par les ${nomT} versés : il en reste de moins en moins.` }
      : { v: 'nulle', txt: `tous les ${h(e)} ont été consommés à l’équivalence.` };
    if (ro === 'specB') return { v: 'cste', txt: `les ${h(e)} ne réagissent pas et on n’en verse pas : leur nombre ne change pas.` };
    if (ro === 'prod') return avant
      ? { v: 'plus', txt: `chaque réaction forme un ${h(e)} : ils s’accumulent.` }
      : { v: 'cste', txt: `il n’y a plus de réaction : plus aucun ${h(e)} n’est formé, leur nombre ne change plus.` };
    return null;
  }
  // diagnostic d'une mauvaise évolution choisie (v) pour l'ion e
  function diagEvolution(t, e, phase, v) {
    const bon = evolution(t, e, phase);
    const debut = {
      plus: `Compte les ${h(e)} dans la loupe à chaque ajout : leur nombre n’augmente pas.`,
      moins: `Les ${h(e)} ne disparaissent pas du bécher.`,
      cste: `Le nombre de ${h(e)} dans la loupe change d’un ajout à l’autre.`,
      nulle: `Il y a des ${h(e)} dans la loupe : leur concentration n’est pas nulle.`,
    }[v];
    if (bon.v === 'nulle' && v === 'cste') return `Une concentration constante et nulle, c’est « reste nulle » : ${bon.txt}`;
    return debut + ' Indice : ' + bon.txt;
  }
  // contribution de l'ion e au coefficient directeur : +λ, −λ ou 0 (λ barré)
  function signe(v) { return v === 'plus' ? 1 : v === 'moins' ? -1 : 0; }
  function coef(t, phase) {
    const termes = ionsTableau(t).map(e => ({ e, s: signe(evolution(t, e, phase).v) })).filter(x => x.s);
    return { termes, val: termes.reduce((a, x) => a + x.s * ESPECES[x.e].lambda, 0) };
  }
  function ecrireSomme(termes, val) {
    let s = '';
    termes.forEach((x, i) => { s += (i ? (x.s < 0 ? ' − ' : ' + ') : (x.s < 0 ? '−' : '')) + ESPECES[x.e].l; });
    return s + ' = ' + court(val);
  }
  // choix du coefficient directeur : le bon, et des erreurs classiques (avec leur diagnostic)
  function choixCoef(t, phase) {
    const bon = coef(t, phase);
    const ions = ionsTableau(t);
    const liste = [{ html: ecrireSomme(bon.termes, bon.val), val: bon.val, juste: true }];
    // tous les λ, même ceux des concentrations nulles ou constantes
    const tous = ions.map(e => ({ e, s: signe(evolution(t, e, phase).v) || 1 }));
    liste.push({ html: ecrireSomme(tous, tous.reduce((a, x) => a + x.s * ESPECES[x.e].lambda, 0)),
      diag: 'Seuls les ions dont la concentration varie font varier σ : un λ barré (concentration nulle ou constante) ne compte pas.' });
    // oubli du signe d'une concentration qui diminue
    if (bon.termes.some(x => x.s < 0)) {
      const p = bon.termes.map(x => ({ e: x.e, s: 1 }));
      liste.push({ html: ecrireSomme(p, p.reduce((a, x) => a + ESPECES[x.e].lambda, 0)),
        diag: 'Une concentration qui diminue fait diminuer σ : son λ compte en négatif.' });
    }
    // seulement les ions de la burette
    const bur = [t.roles.specT, t.roles.reacT].map(e => ({ e, s: 1 }));
    liste.push({ html: ecrireSomme(bur, bur.reduce((a, x) => a + ESPECES[x.e].lambda, 0)),
      diag: 'Ne compte pas les ions versés, mais ceux dont la concentration varie dans le bécher.' });
    // valeurs distinctes seulement
    const vus = new Set(), res = [];
    liste.forEach(c => { const k = c.html.split('=').pop().trim(); if (!vus.has(k)) { vus.add(k); res.push(c); } });
    return res;
  }
  const melanger = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  /* ---------- équation de la réaction, chaque espèce dans sa couleur ---------- */
  function equationHTML(t) {
    return t.equation.map(x => {
      const E = ESPECES[x];
      if (!E) return x === '→' ? '<span class="tc-fl">→</span>' : x;
      return `<span class="tc-c-t-${E.c}">${E.html}${E.solide ? '(s)' : ''}</span>`;
    }).join(' ');
  }

  /* ---------- pastille (HTML) ---------- */
  function pastille(e, cls) {
    const E = ESPECES[e];
    return `<span class="tc-p tc-c-${E.c}${E.molecule ? ' tc-mol' : ''}${E.solide ? ' tc-sol' : ''}${cls ? ' ' + cls : ''}"><span>${E.html}</span></span>`;
  }

  const reduit = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const attendre = ms => new Promise(r => setTimeout(r, reduit() ? Math.min(ms, 60) : ms));

  /* ============================================================
     La loupe : particules qui bougent doucement, gouttes, réactions
     Coordonnées normalisées (0 à 1) dans le carré de la loupe.
     ============================================================ */
  const SURFACE = 0.2;           // niveau de la solution dans la loupe
  function loupe(el) {
    const parts = [];
    let taille = el.clientWidth || 300, rafId = 0, actif = true;
    const R = 0.5;
    function placer(p) {
      p.el.style.transform = `translate(${(p.x * taille).toFixed(1)}px, ${(p.y * taille).toFixed(1)}px) translate(-50%, -50%)` + (p.echelle ? ` scale(${p.echelle})` : '');
    }
    // demi-largeur et demi-hauteur de la pastille (normalisées)
    function mesurer(p) { p.w = (p.el.offsetWidth || 40) / 2 / taille; p.hh = (p.el.offsetHeight || 22) / 2 / taille; }
    // garder la pastille dans la solution (sous la surface, dans le cercle)
    let fondHaut = 1;            // haut du tas de précipité
    function contenir(p) {
      const ymin = SURFACE + p.hh + 0.015;
      let ymax = (p.solide ? 0.97 : 0.95) - p.hh;
      if (!p.solide) ymax = Math.min(ymax, fondHaut - p.hh - 0.01);
      if (p.y < ymin) { p.y = ymin; p.vy = Math.abs(p.vy); }
      if (p.y > ymax) { p.y = ymax; p.vy = -Math.abs(p.vy); }
      // cercle : les coins de la pastille restent dedans
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const cx = p.x + sx * p.w - 0.5, cy = p.y + sy * p.hh - 0.5, d = Math.hypot(cx, cy), lim = R - 0.02;
        if (d > lim) { p.x -= cx / d * (d - lim); p.y -= cy / d * (d - lim); p.vx *= -0.5; p.vy *= -0.5; }
      }
    }
    function ajouter(e, x, y, o) {
      const s = document.createElement('span');
      s.innerHTML = pastille(e);
      const elp = s.firstChild;
      elp.dataset.e = e;
      el.querySelector('.tc-loupe-parts').appendChild(elp);
      const p = Object.assign({ e, el: elp, x, y, vx: 0, vy: 0, libre: true }, o || {});
      mesurer(p);
      parts.push(p);
      placer(p);
      return p;
    }
    function retirer(p) { const i = parts.indexOf(p); if (i >= 0) parts.splice(i, 1); p.el.remove(); }
    function changer(p, e) {
      const s = document.createElement('span');
      s.innerHTML = pastille(e);
      const n = s.firstChild;
      n.dataset.e = e;
      p.el.replaceWith(n);
      p.el = n; p.e = e;
      mesurer(p); placer(p);
      n.classList.add('tc-pop');
    }
    // position libre au hasard dans la solution, loin des autres pastilles
    function positionLibre() {
      let best = null, bd = -1;
      for (let k = 0; k < 40; k++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.4;
        const x = 0.5 + r * Math.cos(a), y = 0.5 + r * Math.sin(a);
        if (y < SURFACE + 0.07 || y > 0.9) continue;
        let d = 9;
        parts.forEach(q => { d = Math.min(d, Math.hypot(q.x - x, (q.y - y) * 1.6)); });
        if (d > bd) { bd = d; best = { x, y }; }
      }
      return best || { x: 0.5, y: 0.6 };
    }
    // agitation thermique douce et répulsion entre pastilles
    function pas() {
      if (!actif) return;
      const calme = reduit();
      fondHaut = parts.reduce((m, q) => q.solide && !q.libre ? Math.min(m, q.y - q.hh) : m, 1);
      parts.forEach(p => {
        if (!p.libre) return;
        if (!calme) {
          p.vx += (Math.random() - 0.5) * 0.0003; p.vy += (Math.random() - 0.5) * 0.0003;
          p.vx *= 0.96; p.vy *= 0.96;
        } else { p.vx = 0; p.vy = 0; }
        if (p.solide) { p.vx = 0; p.vy = calme ? 0 : p.vy + 0.00012; }
      });
      // répulsion (les pastilles ne se chevauchent pas)
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j];
        if (!a.libre && !b.libre) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const ox = a.w + b.w + 0.008 - Math.abs(dx), oy = a.hh + b.hh + 0.008 - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          const k = 0.25;
          if (ox < oy) { const s = Math.sign(dx) || 1; if (a.libre) a.x -= s * ox * k; if (b.libre) b.x += s * ox * k; }
          else { const s = Math.sign(dy) || 1; if (a.libre) a.y -= s * oy * k; if (b.libre) b.y += s * oy * k; }
        }
      }
      parts.forEach(p => { if (p.libre) { p.x += p.vx; p.y += p.vy; contenir(p); } placer(p); });
      rafId = requestAnimationFrame(pas);
    }
    // déplacement animé vers (x, y) en ms
    function aller(p, x, y, ms) {
      p.libre = false;
      const x0 = p.x, y0 = p.y, t0 = performance.now(), d = reduit() ? 1 : ms;
      return new Promise(res => {
        function f(now) {
          const u = Math.min(1, (now - t0) / d), s = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          p.x = x0 + (x - x0) * s; p.y = y0 + (y - y0) * s;
          placer(p);
          if (u < 1) requestAnimationFrame(f); else res();
        }
        requestAnimationFrame(f);
      });
    }
    function redim() {
      taille = el.clientWidth || taille;
      parts.forEach(p => { mesurer(p); placer(p); });
    }
    if (window.ResizeObserver) new ResizeObserver(redim).observe(el); else window.addEventListener('resize', redim);
    rafId = requestAnimationFrame(pas);
    return {
      parts, ajouter, retirer, changer, aller, positionLibre, placer, redim,
      vider() { parts.slice().forEach(retirer); },
      arreter() { actif = false; cancelAnimationFrame(rafId); },
      // éclair à l'endroit d'une réaction
      eclair(x, y) {
        const f = document.createElement('span');
        f.className = 'tc-eclair';
        f.style.left = (x * 100) + '%'; f.style.top = (y * 100) + '%';
        el.querySelector('.tc-loupe-parts').appendChild(f);
        setTimeout(() => f.remove(), 700);
      },
      // mise en valeur des pastilles d'une espèce (ligne du tableau en cours)
      surligner(e) { parts.forEach(p => p.el.classList.toggle('tc-surligne', !!e && p.e === e)); },
    };
  }

  /* ============================================================
     La page
     ============================================================ */
  function creer(zone, o) {
    o = Object.assign({ titrage: 'ethanoique', mode: 'demo' }, o || {});
    let T = TITRAGES.find(t => t.id === o.titrage) || TITRAGES[0];
    let mode = o.mode;
    let S = null;                 // état du titrage en cours
    let jeton = 0;                // annule les animations d'un titrage abandonné

    zone.innerHTML = `<div class="tc-titre-l"><h3 class="tc-titre" data-r="titre"></h3><button type="button" class="btn-small" data-r="recommencer">↺ Recommencer</button></div><div class="tc-grille">
      <div class="tc-gauche">
        <div class="tc-fig" data-r="fig">
          <div class="tc-montage" data-r="montage"></div>
          <div class="tc-loupe-boite">
            <div class="tc-phase" data-r="phase" role="status"></div>
            <div class="tc-loupe" data-r="loupe" role="img" aria-label="Loupe sur la solution du bécher : ions et molécules">
              <div class="tc-loupe-air"><span>1 pastille = quantité<br>apportée par 2 mL</span></div><div class="tc-loupe-sol"></div><div class="tc-loupe-parts"></div>
            </div>
          </div>
          <svg class="tc-liens" data-r="liens" aria-hidden="true"></svg>
        </div>
        <div class="tc-legende" data-r="legende"></div>
        <div class="tc-cmd">
          <button type="button" class="btn-primary tc-verser" data-r="verser">Verser 2 mL</button>
          <button type="button" class="btn-secondary tc-lecture" data-r="lecture" aria-pressed="false">▶ Lecture</button>
          <button type="button" class="btn-small" data-r="annuler" aria-label="Revenir en arrière : enlever les derniers 2 mL versés">↶ Revenir en arrière</button>
          <span class="tc-cmd-msg" data-r="cmdmsg" role="status"></span>
        </div>
        <div class="tc-guide" data-r="guide">
          <ol class="tc-etapes" data-r="etapes"></ol>
          <div class="tc-guide-corps" data-r="corps"></div>
        </div>
      </div>
      <div class="tc-droite">
        <div class="tc-reaction" data-r="reaction"></div>
        <div class="tc-loi" data-r="loi"></div>
        <div class="tc-courbe-z" data-r="courbe"></div>
        <div class="tc-defile"><table class="tc-tab" data-r="tab"></table></div>
      </div>
    </div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const L = loupe(R('loupe'));
    let M = null, Cb = null;

    /* ---------- montage (moteur partagé) et liens de la loupe ---------- */
    function construireMontage() {
      R('montage').innerHTML = '';
      M = TITRAGE.montage(R('montage'), { style: 'realiste', appareil: 'conductimetre',
        textes: { burette: T.burette.texte, becher: T.becher.texte } });
      // unité de l'afficheur du conductimètre : la même que celle du graphique
      M.el.querySelectorAll('text').forEach(tx => { if (tx.textContent === 'σ (mS/m)') tx.textContent = 'σ (' + T.unite.replace('·m⁻¹', '/m') + ')'; });
      // cercle de la loupe sur la solution du bécher
      const svg = M.el.querySelector('svg');
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      Object.entries({ cx: 116, cy: 312, r: 20, class: 'tc-loupe-cercle', 'data-r': 'cible' }).forEach(([k, v]) => c.setAttribute(k, v));
      svg.appendChild(c);
      requestAnimationFrame(liens);
    }
    // deux traits du petit cercle (bécher) à la loupe
    function liens() {
      const svg = R('liens'), fig = R('fig'), cible = M && M.el.querySelector('[data-r="cible"]');
      if (!cible) return;
      const rf = fig.getBoundingClientRect(), rc = cible.getBoundingClientRect(), rl = R('loupe').getBoundingClientRect();
      if (!rf.width || !rl.width) return;
      svg.setAttribute('viewBox', `0 0 ${rf.width} ${rf.height}`);
      const c = { x: rc.left + rc.width / 2 - rf.left, y: rc.top + rc.height / 2 - rf.top, r: rc.width / 2 };
      const l = { x: rl.left + rl.width / 2 - rf.left, y: rl.top + rl.height / 2 - rf.top, r: rl.width / 2 };
      // tangentes extérieures communes aux deux cercles
      const dx = l.x - c.x, dy = l.y - c.y, d = Math.hypot(dx, dy);
      if (d <= l.r - c.r) { svg.innerHTML = ''; return; }
      // normale commune θ = a ± arccos((r₁ − r₂) / d) ; points de contact sur chaque cercle
      const a = Math.atan2(dy, dx), b = Math.acos((c.r - l.r) / d);
      const t = s => { const th = a + s * b; return { x1: c.x + c.r * Math.cos(th), y1: c.y + c.r * Math.sin(th), x2: l.x + l.r * Math.cos(th), y2: l.y + l.r * Math.sin(th) }; };
      svg.innerHTML = [t(1), t(-1)].map(s => `<line x1="${s.x1.toFixed(1)}" y1="${s.y1.toFixed(1)}" x2="${s.x2.toFixed(1)}" y2="${s.y2.toFixed(1)}"/>`).join('');
    }
    if (window.ResizeObserver) new ResizeObserver(() => { L.redim(); liens(); }).observe(R('fig'));
    window.addEventListener('resize', liens);

    /* ---------- courbe σ = f(V) (moteur partagé) ---------- */
    function construireCourbe() {
      R('courbe').innerHTML = '';
      Cb = TITRAGE.courbe(R('courbe'), { xMax: T.vMax, y: Object.assign({ nom: 'σ (' + T.unite + ')', court: 'σ' }, T.y) });
      Cb.el.classList.add('tc-courbe');
      Cb.surRedessin(G => {
        const c = Cb.couche('outils'), mk = Cb.mk;
        if (!S) return;
        // droites des deux phases, quand le coefficient directeur est trouvé
        ['avant', 'apres'].forEach(ph => {
          if (!S.coefFait[ph]) return;
          const v0 = ph === 'avant' ? 0 : T.ve, v1 = ph === 'avant' ? Math.min(S.V, T.ve) : S.V;
          if (v1 <= v0) return;
          mk('line', { class: 'tc-dr', x1: G.X(v0), y1: G.Y(sigma(T, v0)), x2: G.X(v1), y2: G.Y(sigma(T, v1)) }, c);
          const vm = (v0 + v1) / 2, cc = coef(T, ph);
          const tx = mk('text', { class: 'tc-pente', x: G.X(vm), y: G.Y(sigma(T, vm)) - 13, 'text-anchor': 'middle' }, c);
          tx.textContent = 'pente ∝ ' + court(cc.val);
        });
        // équivalence
        if (S.V >= T.ve) {
          const p = G.haut[0];
          mk('line', { class: 'tc-ve', x1: G.X(T.ve), x2: G.X(T.ve), y1: p.y0, y2: p.y1 }, c);
          const tx = mk('text', { class: 'tc-ve-txt', x: G.X(T.ve) + 4, y: p.y0 - 6 }, Cb.couche('dessus'));
          tx.innerHTML = 'V<tspan baseline-shift="sub" font-size="72%">E</tspan>';
        }
      });
    }
    function majCourbe() {
      const m = [];
      for (let v = 0; v <= S.V; v += PAS) m.push([v * 10, sigma(T, v)]);
      Cb.maj(m);
    }

    /* ---------- état initial d'un titrage ---------- */
    function demarrer() {
      jeton++;
      lecture(false);
      S = { V: 0, anime: false, loi: mode === 'demo', cases: {}, coefFait: {}, justif: false, hist: [] };
      zone.dataset.titrage = T.id;
      construireMontage();
      construireCourbe();
      L.vider();
      // le bécher : V_E / 2 pastilles de l'espèce titrée (+ ion spectateur)
      const aPlacer = [];
      for (let i = 0; i < T.ve / PAS; i++) { aPlacer.push(T.roles.reacB); if (T.roles.specB) aPlacer.push(T.roles.specB); }
      aPlacer.forEach(e => { const p = L.positionLibre(); L.ajouter(e, p.x, p.y); });
      R('titre').innerHTML = T.titre;
      R('reaction').innerHTML = `<span class="tc-reac-t">Réaction de titrage</span><span class="tc-eq-txt">${equationHTML(T)}</span>`;
      majMontage(false);
      majCourbe();
      tableau();
      majLoi();
      majLegende();
      majPhase();
      guide();
    }
    function majMontage(goutte) {
      M.maj({ V: S.V, affichage: fmt(sigma(T, S.V), T.unite === 'S·m⁻¹' ? 3 : 1), goutte, volumeBecher: 30 });
    }

    /* ---------- légende : chaque espèce et son nombre de pastilles ---------- */
    function majLegende() {
      const n = compter(T, S.V);
      const ordre = [T.roles.specT, T.roles.reacT, T.roles.reacB, T.roles.specB, T.roles.prod].filter(Boolean);
      R('legende').innerHTML = ordre.map(e => `<span class="tc-leg">${pastille(e)}<b>× ${Math.round(n[e] / PAS)}</b></span>`).join('');
    }

    /* ---------- bandeau de phase au-dessus de la loupe ---------- */
    function majPhase() {
      const p = R('phase'), b = R('loupe');
      const v = 'V = ' + fmt(S.V, 1) + ' mL';
      b.classList.toggle('tc-eq', S.V === T.ve);
      if (S.V === 0) p.innerHTML = `<span>Avant de verser</span><b>${v}</b>`;
      else if (S.V < T.ve) p.innerHTML = `<span>Avant l’équivalence</span><b>${v}</b>`;
      else if (S.V === T.ve) p.innerHTML = `<span class="tc-phase-eq">Équivalence</span><b>V = V<sub>E</sub> = ${fmt(T.ve, 1)} mL</b>`;
      else p.innerHTML = `<span>Après l’équivalence</span><b>${v}</b>`;
      p.className = 'tc-phase' + (S.V === T.ve ? ' tc-phase-equi' : S.V > T.ve ? ' tc-phase-apres' : '');
    }

    /* ---------- loi de Kohlrausch ---------- */
    function majLoi() {
      const ions = ionsTableau(T);
      const termes = ions.map(e => `λ<sub class="tc-c-t-${ESPECES[e].c}">${h(e)}</sub>·<span class="tc-c-t-${ESPECES[e].c}">[${h(e)}]</span>`).join(' + ');
      // valeurs des λ (une fois la loi trouvée : elles donnent les ions)
      const lambdas = ions.map(e => `<span class="tc-nw"><span class="tc-c-t-${ESPECES[e].c}">λ<sub>${h(e)}</sub></span> = ${ESPECES[e].l} mS·m<sup>2</sup>·mol<sup>−1</sup></span>`).join(' ; ');
      R('loi').innerHTML = `<span class="tc-loi-t">Loi de Kohlrausch</span><span class="tc-loi-f">` +
        (S.loi ? `σ = ${termes}` : `σ = <span class="tc-a-faire">à compléter (étape 1)</span>`) + '</span>' +
        (S.loi ? `<span class="tc-lambdas">${lambdas}</span>` : '');
      R('loi').classList.toggle('tc-loi-ok', S.loi);
    }

    /* ---------- tableau des concentrations ---------- */
    function tableau() {
      const ions = ionsTableau(T);
      const ligne = e => `<tr data-e="${e}"><th scope="row" class="tc-c-t-${ESPECES[e].c}">[${h(e)}]</th>` +
        ['avant', 'apres'].map(ph => `<td class="tc-evo" data-c="${ph}|${e}"></td><td class="tc-lam" data-l="${ph}|${e}"></td>`).join('') + '</tr>';
      R('tab').innerHTML = `<thead>
          <tr><th rowspan="2" class="tc-coin"></th><th colspan="2" data-ph="avant">Avant l’équivalence</th><th colspan="2" data-ph="apres">Après l’équivalence</th></tr>
          <tr><th>Évolution de la concentration</th><th>λ</th><th>Évolution de la concentration</th><th>λ</th></tr>
        </thead>
        <tbody>${ions.map(ligne).join('')}
          <tr class="tc-coef-l"><th scope="row">Coefficient directeur de σ</th><td colspan="2" data-coef="avant"></td><td colspan="2" data-coef="apres"></td></tr>
        </tbody>`;
      R('tab').insertAdjacentHTML('afterend', '');
      majTableau();
    }
    function cellule(ph, e) { return R('tab').querySelector(`[data-c="${ph}|${e}"]`); }
    function majTableau() {
      const actif = S.question;
      ionsTableau(T).forEach(e => ['avant', 'apres'].forEach(ph => {
        const c = cellule(ph, e), l = R('tab').querySelector(`[data-l="${ph}|${e}"]`);
        const fait = S.cases[ph + '|' + e];
        const ev = evolution(T, e, ph);
        c.innerHTML = fait ? `<span class="tc-evo-s tc-evo-${ev.v}">${EVOS[ev.v].sym}</span> <span class="tc-evo-n">${EVOS[ev.v].nom}</span>` : '';
        l.innerHTML = fait ? `<span class="${signe(ev.v) ? '' : 'tc-barre'}" title="${signe(ev.v) ? '' : 'Ne compte pas : concentration nulle ou constante'}">${ESPECES[e].l}</span>` : '';
        c.classList.toggle('tc-actif', !!actif && actif.type === 'evo' && actif.ph === ph && actif.e === e);
      }));
      ['avant', 'apres'].forEach(ph => {
        const z = R('tab').querySelector(`[data-coef="${ph}"]`), cc = coef(T, ph);
        z.innerHTML = S.coefFait[ph] ? `<b>${ecrireSomme(cc.termes, cc.val)}</b>` : '';
        z.classList.toggle('tc-actif', !!actif && actif.type === 'coef' && actif.ph === ph);
      });
      ['avant', 'apres'].forEach(ph => R('tab').querySelector(`th[data-ph="${ph}"]`).classList.toggle('tc-ph-ici', etapeCourante() === (ph === 'avant' ? 2 : 4)));
    }
    const colonneFaite = ph => ionsTableau(T).every(e => S.cases[ph + '|' + e]) && S.coefFait[ph];

    /* ---------- étapes ---------- */
    const ETAPES = ['Kohlrausch', 'Avant', 'Équivalence', 'Après', 'Justification'];
    function etapeCourante() {
      if (!S.loi) return 1;
      if (!colonneFaite('avant') || S.V < T.ve) return 2;
      if (S.V === T.ve) return 3;
      if (!colonneFaite('apres')) return 4;
      return 5;
    }
    function majEtapes() {
      const n = etapeCourante();
      R('etapes').innerHTML = ETAPES.map((t, i) => `<li class="${i + 1 < n || (i + 1 === 5 && S.justif) ? 'fait' : i + 1 === n ? 'ici' : ''}"${i + 1 === n ? ' aria-current="step"' : ''}><span>${t}</span></li>`).join('');
    }

    /* ---------- le guide : consigne, questions (« À toi ») ou explications (démonstration) ---------- */
    function corps(html) { R('corps').innerHTML = html; R('guide').scrollTop = 0; }
    // amène un élément à l'écran (dans le guide et dans la page), sans sauter
    function defiler(el) { requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); }
    function retour(zoneR, ok, html) {
      zoneR.innerHTML = `<div class="${ok ? 'callout-success' : 'callout-danger'} tc-retour" role="status"><b>${ok === 'apres' ? 'C’est juste.' : ok ? 'Juste !' : 'Ce n’est pas ça.'}</b> ${html || ''}</div>`;
      defiler(zoneR);
    }
    function guide() {
      S.question = null;
      L.surligner(null);
      majEtapes();
      majTableau();
      majCommandes();
      const n = etapeCourante();
      if (n === 1) return questionLoi();
      if (mode === 'demo') return guideDemo(n);
      // « À toi »
      if (n === 2 || n === 4) {
        const ph = n === 2 ? 'avant' : 'apres';
        const seuil = ph === 'avant' ? 2 * PAS : T.ve + 2 * PAS;
        if (S.V < seuil) return corps(consigneVerser(ph));
        if (colonneFaite(ph)) return corps(`<p class="tc-consigne">✓ Colonne complète. Continue à verser jusqu’à l’équivalence et observe ce qui se passe dans la loupe.</p>`);
        const e = ionsTableau(T).find(x => !S.cases[ph + '|' + x]);
        if (e) return questionEvo(ph, e);
        return questionCoef(ph);
      }
      if (n === 3) return corps(texteEquivalence() + `<p class="tc-consigne">Continue à verser : observe ce qui change dans la loupe.</p>`);
      if (n === 5) return S.justif ? fin() : questionJustif();
    }
    function consigneVerser(ph) {
      return ph === 'avant'
        ? `<p class="tc-consigne">Verse la solution de la burette (${T.burette.nom}) 2 mL par 2 mL et observe la loupe. À partir de 4 mL versés, complète la colonne <b>« avant l’équivalence »</b>.</p>`
        : `<p class="tc-consigne">Continue à verser au-delà de l’équivalence et observe la loupe. À partir de V<sub>E</sub> + 4 mL, complète la colonne <b>« après l’équivalence »</b>.</p>`;
    }
    function texteEquivalence() {
      const r = T.roles;
      return `<p class="tc-expl"><b>Équivalence (V<sub>E</sub> = ${fmt(T.ve, 1)} mL).</b> Le dernier ${h(r.reacT)} versé a réagi avec le dernier ${h(r.reacB)} : il n’en reste plus dans le bécher. Les réactifs ont été introduits dans les proportions stœchiométriques. À partir de maintenant, les ${h(r.reacT)} versés ne réagissent plus.</p>`;
    }

    // étape 1 : quelles espèces dans la loi de Kohlrausch ?
    function questionLoi() {
      const r = T.roles;
      const toutes = [r.specT, r.reacT, r.reacB, r.specB, r.prod, 'H2O'].filter(Boolean);
      const choix = melanger(toutes);
      const bons = ionsTableau(T);
      corps(`<p class="tc-q">Dans la loi de Kohlrausch, σ est la somme des termes λ·[X]. <b>Touche les espèces qui y apparaissent</b> (pense aussi à celles qui vont se former).</p>
        <div class="tc-chips">${choix.map(e => `<button type="button" class="tc-chip" data-e="${e}" aria-pressed="false">${pastille(e)}</button>`).join('')}</div>
        <div class="tc-actions"><button type="button" class="btn-primary" data-r="valider">Valider</button>
          <button type="button" class="btn-small" data-r="montrer" hidden>Afficher la réponse</button></div>
        <div data-r="ret"></div>`);
      const z = R('corps');
      z.querySelectorAll('.tc-chip').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')));
      let err = 0;
      const ok = apres => { S.loi = true; majLoi(); retour(z.querySelector('[data-r="ret"]'), apres ? 'apres' : true, 'Seuls les ions conduisent le courant : les molécules (et un solide) ne portent pas de charge.'); setTimeout(guide, 1400); };
      z.querySelector('[data-r="valider"]').addEventListener('click', () => {
        const pris = [...z.querySelectorAll('.tc-chip[aria-pressed="true"]')].map(b => b.dataset.e);
        const mol = pris.find(e => !bons.includes(e));
        const manque = bons.find(e => !pris.includes(e));
        if (!mol && !manque) return ok(err > 0);
        err++;
        let d;
        if (mol && ESPECES[mol].solide) d = `${h(mol)} est un solide : il ne conduit pas le courant.`;
        else if (mol) d = `${h(mol)} est une molécule : elle ne porte pas de charge, elle ne conduit pas le courant.`;
        else if (manque === T.roles.prod) d = `Il manque un ion qui se forme pendant le titrage : regarde l’équation de la réaction.`;
        else d = `Il manque un ion présent dans le bécher pendant le titrage (versé ou déjà présent).`;
        retour(z.querySelector('[data-r="ret"]'), false, d + (err >= 2 ? ' Corrige ta réponse, ou affiche la réponse.' : ''));
        if (err >= 2) z.querySelector('[data-r="montrer"]').hidden = false;
      });
      z.querySelector('[data-r="montrer"]').addEventListener('click', () => {
        z.querySelectorAll('.tc-chip').forEach(b => b.setAttribute('aria-pressed', bons.includes(b.dataset.e) ? 'true' : 'false'));
        S.loi = true; majLoi();
        z.querySelector('[data-r="ret"]').innerHTML = `<div class="callout tc-retour"><b>Réponse</b> Seuls les ions comptent : ${bons.map(h).join(', ')}.</div>`;
        setTimeout(guide, 1600);
      });
    }

    // évolution d'une concentration (« À toi »)
    function questionEvo(ph, e) {
      S.question = { type: 'evo', ph, e };
      majTableau();
      L.surligner(e);
      const quand = ph === 'avant' ? 'Avant l’équivalence' : 'Après l’équivalence';
      corps(`<p class="tc-q">${quand}, comment évolue <b class="tc-c-t-${ESPECES[e].c}">[${h(e)}]</b> quand on verse ? <span class="tc-petit">(observe les ${pastille(e)} dans la loupe)</span></p>
        <div class="tc-choix">${['plus', 'moins', 'cste', 'nulle'].map(v => `<button type="button" class="btn-secondary tc-choix-b" data-v="${v}"><span class="tc-evo-s">${EVOS[v].sym}</span> ${EVOS[v].nom}</button>`).join('')}</div>
        <div class="tc-actions"><button type="button" class="btn-small" data-r="montrer" hidden>Afficher la réponse</button></div>
        <div data-r="ret"></div>`);
      const z = R('corps'), bon = evolution(T, e, ph);
      let err = 0;
      const valider = (apres, montre) => {
        S.cases[ph + '|' + e] = true;
        majTableau();
        z.querySelectorAll('.tc-choix-b').forEach(b => { b.disabled = true; if (b.dataset.v === bon.v) b.classList.add('tc-bon'); });
        if (montre) z.querySelector('[data-r="ret"]').innerHTML = `<div class="callout tc-retour"><b>Réponse</b> ${EVOS[bon.v].sym} ${EVOS[bon.v].nom} : ${bon.txt}</div>`;
        else retour(z.querySelector('[data-r="ret"]'), apres ? 'apres' : true, bon.txt);
        z.querySelector('[data-r="montrer"]').hidden = true;
        setTimeout(guide, 1500);
      };
      z.querySelectorAll('.tc-choix-b').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.v === bon.v) return valider(err > 0);
        err++;
        b.classList.add('tc-faux');
        retour(z.querySelector('[data-r="ret"]'), false, diagEvolution(T, e, ph, b.dataset.v) + (err >= 2 ? ' Corrige ta réponse, ou affiche la réponse.' : ''));
        if (err >= 2) z.querySelector('[data-r="montrer"]').hidden = false;
      }));
      z.querySelector('[data-r="montrer"]').addEventListener('click', () => valider(false, true));
    }

    // coefficient directeur (« À toi »)
    function questionCoef(ph) {
      S.question = { type: 'coef', ph };
      majTableau();
      const choix = melanger(choixCoef(T, ph));
      corps(`<p class="tc-q">D’après la loi de Kohlrausch, le coefficient directeur de σ = f(V) est proportionnel à la somme des λ des ions dont la concentration varie (λ compté en négatif si la concentration diminue). <b>Lequel est juste ${ph === 'avant' ? 'avant' : 'après'} l’équivalence ?</b></p>
        <div class="tc-choix tc-choix-coef">${choix.map((c, i) => `<button type="button" class="btn-secondary tc-choix-b" data-i="${i}">${c.html}</button>`).join('')}</div>
        <div class="tc-actions"><button type="button" class="btn-small" data-r="montrer" hidden>Afficher la réponse</button></div>
        <div data-r="ret"></div>`);
      const z = R('corps');
      let err = 0;
      const valider = (apres, montre) => {
        S.coefFait[ph] = true;
        S.question = null;
        majTableau(); majCourbe();
        z.querySelectorAll('.tc-choix-b').forEach(b => { b.disabled = true; if (choix[b.dataset.i].juste) b.classList.add('tc-bon'); });
        const txt = 'La droite correspondante est tracée sur le graphique.';
        if (montre) z.querySelector('[data-r="ret"]').innerHTML = `<div class="callout tc-retour"><b>Réponse</b> ${choix.find(c => c.juste).html}. ${txt}</div>`;
        else retour(z.querySelector('[data-r="ret"]'), apres ? 'apres' : true, txt);
        z.querySelector('[data-r="montrer"]').hidden = true;
        setTimeout(guide, 1600);
      };
      z.querySelectorAll('.tc-choix-b').forEach(b => b.addEventListener('click', () => {
        const c = choix[b.dataset.i];
        if (c.juste) return valider(err > 0);
        err++;
        b.classList.add('tc-faux');
        retour(z.querySelector('[data-r="ret"]'), false, c.diag + (err >= 2 ? ' Corrige ta réponse, ou affiche la réponse.' : ''));
        if (err >= 2) z.querySelector('[data-r="montrer"]').hidden = false;
      }));
      z.querySelector('[data-r="montrer"]').addEventListener('click', () => valider(false, true));
    }

    // justification de l'allure de la courbe (« À toi »)
    function questionJustif() {
      const J = T.justif, choix = melanger(J.choix);
      corps(`<p class="tc-q"><b>${J.q}</b> Compare les coefficients directeurs du tableau et les valeurs de λ.</p>
        <div class="tc-choix tc-choix-long">${choix.map((c, i) => `<button type="button" class="btn-secondary tc-choix-b" data-i="${i}">${c.html}</button>`).join('')}</div>
        <div class="tc-actions"><button type="button" class="btn-small" data-r="montrer" hidden>Afficher la réponse</button></div>
        <div data-r="ret"></div>`);
      const z = R('corps');
      let err = 0;
      const valider = (apres, montre) => {
        S.justif = true;
        z.querySelectorAll('.tc-choix-b').forEach(b => { b.disabled = true; if (choix[b.dataset.i].juste) b.classList.add('tc-bon'); });
        if (montre) z.querySelector('[data-r="ret"]').innerHTML = '<div class="callout tc-retour"><b>Réponse</b> Voici la justification complète à écrire.</div>';
        else retour(z.querySelector('[data-r="ret"]'), apres ? 'apres' : true, 'Voici la justification complète à écrire.');
        majEtapes();
        setTimeout(fin, 1800);
      };
      z.querySelectorAll('.tc-choix-b').forEach(b => b.addEventListener('click', () => {
        const c = choix[b.dataset.i];
        if (c.juste) return valider(err > 0);
        err++;
        b.classList.add('tc-faux');
        retour(z.querySelector('[data-r="ret"]'), false, c.diag + (err >= 2 ? ' Corrige ta réponse, ou affiche la réponse.' : ''));
        if (err >= 2) z.querySelector('[data-r="montrer"]').hidden = false;
      }));
      z.querySelector('[data-r="montrer"]').addEventListener('click', () => valider(false, true));
    }
    const conclusion = () => `<div class="tc-conclusion"><b class="cle-titre">Justification.</b> ${T.justif.texte}</div>`;
    function fin() {
      majEtapes();
      corps(`${conclusion()}<p class="tc-expl tc-fini"><b>✓ Allure de la courbe justifiée.</b> Le tableau et cette justification résument le raisonnement à écrire sur ta copie.</p>`);
      if (o.surFin) o.surFin(T.id);
    }

    /* ---------- démonstration : le tableau se remplit tout seul, avec les explications ---------- */
    function guideDemo(n) {
      if (n === 2 || n === 4) {
        const ph = n === 2 ? 'avant' : 'apres';
        const seuil = ph === 'avant' ? 2 * PAS : T.ve + 2 * PAS;
        if (colonneFaite(ph)) return corps(`<p class="tc-consigne">Colonne complète. Verse jusqu’à l’équivalence : observe le dernier ${h(T.roles.reacB)} disparaître.</p>`);
        if (S.V < seuil) return corps((n === 2 && S.V === 0 ? `<p class="tc-expl"><b>Loi de Kohlrausch.</b> Seuls les ions conduisent le courant : ${T.roles.reacB === 'CH3COOH' || T.roles.reacB === 'NH3' ? h(T.roles.reacB) + ' est une molécule, il n’apparaît pas dans la loi.' : 'l’eau formée n’y apparaît pas.'}</p>` : '') + consigneVerser(ph).replace('complète', 'le tableau complète'));
        remplirDemo(ph);
        return;
      }
      if (n === 3) return corps(texteEquivalence() + `<p class="tc-consigne">Verse encore pour passer après l’équivalence.</p>`);
      if (n === 5) { S.justif = true; majEtapes(); if (o.surFin) o.surFin(T.id); return corps(`<p class="tc-q"><b>${T.justif.q}</b></p>${conclusion()}`); }
    }
    // remplit la colonne case par case (1,6 s chacune), la ligne en cours mise en valeur dans la loupe
    async function remplirDemo(ph) {
      if (S.demoEnCours) return;
      S.demoEnCours = true;
      const j = jeton;
      for (const e of ionsTableau(T)) {
        if (S.cases[ph + '|' + e]) continue;
        S.question = { type: 'evo', ph, e };
        L.surligner(e);
        const ev = evolution(T, e, ph);
        S.cases[ph + '|' + e] = true;
        majTableau();
        corps(`<p class="tc-expl"><b class="tc-c-t-${ESPECES[e].c}">[${h(e)}]</b> ${EVOS[ev.v].sym} ${EVOS[ev.v].nom} : ${ev.txt}${signe(ev.v) ? '' : ` λ(${h(e)}) est barré : cet ion ne change pas σ.`}</p>`);
        await attendre(2600);
        if (j !== jeton) return;
      }
      S.question = { type: 'coef', ph };
      L.surligner(null);
      S.coefFait[ph] = true;
      majTableau(); majCourbe();
      const cc = coef(T, ph);
      corps(`<p class="tc-expl"><b>Coefficient directeur.</b> Il est proportionnel à la somme des λ des ions dont la concentration varie (en négatif si elle diminue) : ${ecrireSomme(cc.termes, cc.val)}. La droite est tracée sur le graphique.</p>`);
      await attendre(2600);
      if (j !== jeton) return;
      S.demoEnCours = false;
      S.question = null;
      majTableau(); majEtapes();
      if (etapeCourante() !== (ph === 'avant' ? 2 : 4)) guide();
    }

    /* ---------- commandes ---------- */
    function peutVerser() {
      if (S.anime || S.V >= T.vMax || !S.loi) return false;
      // « À toi » : à l'équivalence, la colonne « avant » doit être remplie pour continuer
      if (mode === 'toi' && S.V >= T.ve && !colonneFaite('avant')) return false;
      return true;
    }
    function majCommandes() {
      const v = R('verser'), lec = R('lecture'), msg = R('cmdmsg');
      v.disabled = !peutVerser();
      R('annuler').disabled = S.anime || !S.hist.length;
      lec.disabled = !S.loi || S.V >= T.vMax || (mode === 'toi' && S.V >= T.ve && !colonneFaite('avant'));
      let m = '';
      if (!S.loi) m = 'Complète d’abord la loi de Kohlrausch.';
      else if (S.V >= T.vMax) m = 'Burette vidée jusqu’à ' + T.vMax + ' mL.';
      else if (mode === 'toi' && S.V >= T.ve && !colonneFaite('avant')) m = 'Équivalence : complète la colonne « avant l’équivalence » pour continuer.';
      msg.textContent = m;
    }
    let minuterie = null;
    function lecture(on) {
      const b = R('lecture');
      if (on && !peutVerser() && !S.anime) on = false;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? '❚❚ Pause' : '▶ Lecture';
      clearTimeout(minuterie);
      S && (S.lecture = on);
      if (on) boucle();
    }
    async function boucle() {
      if (!S.lecture) return;
      if (!S.anime) {
        if (!peutVerser()) return lecture(false);
        await verser();
        // pause automatique à l'équivalence, pour bien la voir
        if (S.V === T.ve) return lecture(false);
      }
      minuterie = setTimeout(boucle, reduit() ? 600 : 700);
    }

    /* ---------- verser 1 mL : la goutte, les ions qui tombent, la réaction ---------- */
    async function verser() {
      if (!peutVerser()) return;
      const j = jeton, r = T.roles;
      S.anime = true;
      majCommandes();
      S.hist.push(instantane());
      S.V += PAS;
      majMontage(true);
      // la goutte tombe dans la loupe avec un ion de chaque sorte
      const g = document.createElement('span');
      g.className = 'tc-goutte';
      R('loupe').querySelector('.tc-loupe-parts').appendChild(g);
      const x0 = 0.42 + Math.random() * 0.16;
      const a = L.ajouter(r.specT, x0 - 0.06, -0.06), b = L.ajouter(r.reacT, x0 + 0.06, -0.06);
      a.libre = b.libre = false;
      g.style.left = (x0 * 100) + '%';
      await Promise.all([L.aller(a, x0 - 0.07, SURFACE + 0.09, 520), L.aller(b, x0 + 0.07, SURFACE + 0.09, 520)]);
      g.remove();
      if (j !== jeton) return;
      // les ions se dispersent ; l'ion spectateur reste libre
      const placeA = L.positionLibre();
      L.aller(a, placeA.x, placeA.y, 900).then(() => { a.libre = true; });
      const cible = S.V <= T.ve ? plusProche(b, r.reacB) : null;
      if (!cible) {
        const placeB = L.positionLibre();
        await L.aller(b, placeB.x, placeB.y, 900);
        b.libre = true;
      } else {
        cible.libre = false;
        await attendre(150);
        await L.aller(b, cible.x, cible.y - 0.01, 650);
        if (j !== jeton) return;
        L.eclair(cible.x, cible.y);
        const prod = r.prod;
        if (prod && ESPECES[prod].solide) {
          // précipité : les deux ions s'unissent en AgCl qui tombe au fond
          L.retirer(b);
          const x = cible.x, y = cible.y;
          L.retirer(cible);
          const s = L.ajouter(prod, x, y, { solide: true });
          s.el.classList.add('tc-pop');
          await attendre(250);
          if (j !== jeton) return;
          const fond = placeFond(s);
          await L.aller(s, fond.x, fond.y, 900);
          s.libre = false;
        } else if (prod) {
          // l'espèce titrée devient le produit, l'ion versé disparaît (H₂O)
          b.el.classList.add('tc-disparait');
          L.changer(cible, prod);
          cible.libre = true;
          setTimeout(() => L.retirer(b), 450);
        } else {
          // H₃O⁺ + HO⁻ → 2 H₂O : les deux ions disparaissent
          b.el.classList.add('tc-disparait'); cible.el.classList.add('tc-disparait');
          setTimeout(() => { L.retirer(b); L.retirer(cible); }, 450);
        }
        await attendre(450);
      }
      if (j !== jeton) return;
      majCourbe();
      majLegende();
      majPhase();
      if (S.V === T.ve) R('loupe').classList.add('tc-eq-flash');
      setTimeout(() => R('loupe').classList.remove('tc-eq-flash'), 1600);
      S.anime = false;
      const avant = etapeCourante();
      majCommandes();
      // nouveau guide seulement si l'étape change ou qu'une colonne peut commencer
      if (S.V === T.ve || S.V === 2 * PAS || S.V === T.ve + PAS || S.V === T.ve + 2 * PAS || avant !== S.etapeVue) guide();
      S.etapeVue = etapeCourante();
      majEtapes(); majTableau();
    }
    function plusProche(p, e) {
      let best = null, bd = 9;
      L.parts.forEach(q => { if (q.e === e && q.libre !== false) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } } });
      if (!best) L.parts.forEach(q => { if (q.e === e && !best) best = q; });
      return best;
    }
    // place du précipité : au fond de la loupe, en tas, rangée par rangée (largeur réelle des grains)
    function placeFond(s) {
      const n = L.parts.filter(q => q.solide && q !== s).length;
      const gw = 2 * s.w + 0.008, gh = 2 * s.hh + 0.006;
      let reste = n;
      for (let k = 0; k < 12; k++) {
        const y = 0.955 - s.hh - k * gh;
        const bas = y + s.hh - 0.5, demi = Math.sqrt(Math.max(0, 0.455 * 0.455 - bas * bas));
        const nb = Math.max(1, Math.floor(2 * demi / gw));
        if (reste < nb) return { x: 0.5 + (reste - (nb - 1) / 2) * gw, y };
        reste -= nb;
      }
      return { x: 0.5, y: 0.6 };
    }

    /* ---------- revenir en arrière : état d'avant le dernier ajout (pastilles, tableau, étapes) ---------- */
    function instantane() {
      return { V: S.V, loi: S.loi, justif: S.justif, cases: Object.assign({}, S.cases), coefFait: Object.assign({}, S.coefFait),
        parts: L.parts.map(p => ({ e: p.e, x: p.x, y: p.y, solide: !!p.solide })) };
    }
    function annuler() {
      if (S.anime || !S.hist.length) return;
      lecture(false);
      jeton++;                       // arrête un remplissage de démonstration en cours
      const a = S.hist.pop();
      Object.assign(S, { V: a.V, loi: a.loi, justif: a.justif, cases: a.cases, coefFait: a.coefFait, demoEnCours: false, question: null });
      L.vider();
      a.parts.forEach(q => { const p = L.ajouter(q.e, q.x, q.y, q.solide ? { solide: true } : null); if (q.solide) p.libre = false; });
      R('loupe').classList.remove('tc-eq-flash');
      majMontage(false); majCourbe(); majLoi(); majLegende(); majPhase();
      S.etapeVue = etapeCourante();
      guide();
    }

    R('verser').addEventListener('click', () => { lecture(false); verser(); });
    R('annuler').addEventListener('click', annuler);
    R('lecture').addEventListener('click', () => lecture(R('lecture').getAttribute('aria-pressed') !== 'true'));
    R('recommencer').addEventListener('click', demarrer);

    const api = {
      choisir(id) { T = TITRAGES.find(t => t.id === id) || T; demarrer(); if (o.surChangement) o.surChangement({ titrage: T.id }); },
      mode(m) { mode = m; demarrer(); },
      recommencer: demarrer,
      titrage: () => T,
    };
    demarrer();
    return api;
  }

  window.TC = { TITRAGES, ESPECES, creer, sigma, compter, fmt };

  /* ---------- plan de l'application : un seul module, une page d'animation ---------- */
  const PLAN = [
    { n: 1, titre: 'Conductivité pendant un titrage', desc: 'Les ions dans le bécher, loi de Kohlrausch, allure de σ = f(V)',
      parties: [{ nom: 'Animation', simulation: 'module_1_animation', noms: { simulation: 'Animation : conductivité pendant un titrage' } }] },
  ];
  if (window.SOM) SOM.init({ nom: 'Titrage conductimétrique', id: 'titrage-conductimetrique', plan: PLAN });
})();
