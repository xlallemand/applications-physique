/* ============================================================
   CCM : chromatographie sur couche mince (plaque, taches, cuve, élution)
   Outil partagé : créé pour l'application « Chromatographie sur couche
   mince » (chromatographie/), réutilisé par « Synthèse et montage à
   reflux » (synthese/, chargé par ../../chromatographie/modules/ccm.js).
   Ne dépend d'aucun moteur d'application ; styles : classes ccm- de
   chromatographie/modules/cc.css (à charger avec l'outil).

   Unités : toutes les longueurs sont en cm sur la plaque, mesurées
   depuis le bord gauche (x) et depuis le bas de la plaque (y).
   Hauteur relative d'une espèce h : rapport hauteur de la tache /
   hauteur du front, toutes deux mesurées depuis le trait de dépôt
   (0 < h < 1). Une même espèce monte toujours à la même hauteur relative.

   CCM.ESPECES   { id: { nom, h, couleur, le, du, de } }
                 nom : nom affiché ; g : 'f' si le nom est féminin ; couleur : vrai si l'espèce est colorée
                 (visible sans lampe UV) ; le / du / de : « le limonène »,
                 « du limonène », « de limonène » (phrases des conclusions).
   CCM.hauteur(id) → h

   CCM.plaque(zone, options) → contrôleur      plaque seule (chromatogramme)
   CCM.animation(zone, options) → contrôleur   cuve, éluant, couvercle et plaque ; élution animée
     options communes :
       depots: [{ nom, especes: [id], x }]   x (cm) facultatif : dépôts répartis sinon
       largeur (cm, défaut : nombre de dépôts + 1), hauteur (cm, défaut 10),
       trait (cm, hauteur du trait de dépôt, défaut 1 ; null : pas encore tracé),
       traitProgres (0 à 1 : trait en cours de tracé), noms (vrai : noms sous le trait),
       front (cm : front de l'éluant ; 'final' : 1 cm sous le haut ; null : plaque sèche),
       mouille (vrai : partie mouillée visible), frontTrait (cm | 'final' | null : trait au crayon du front),
       uv (vrai : plaque sous la lampe UV), rendu ('labo' : taches colorées seules visibles hors UV ;
       'figure' : toutes les taches en gris, comme un chromatogramme révélé),
       cercles: [cle], selection: [cle], marque: cle    (cle d'une tache : 'i|id' = dépôt i, espèce id)
       pointilles ('selection' : entre taches choisies de même hauteur ; 'tous' ; false),
       interactif (vrai : toucher une tache appelle onTache), onTache({ cle, depot, espece, h }),
       echelle (unités SVG par cm, défaut 30 ; 28 pour la cuve), aria (texte de la figure),
       calque(g) → code SVG ajouté par-dessus (outils propres à une page), redessiné à chaque fois
       fixe(g, groupe) → met à jour des éléments persistants (poignées à glisser) du groupe groupe,
                         qui n'est jamais redessiné : un élément touché n'est pas retiré pendant un glisser
     options de l'animation :
       cuve (vrai : cuve dessinée), dansCuve (vrai : plaque posée dans la cuve ;
       faux : plaque en attente, en transparence), niveau (cm d'éluant), couvercle (vrai : fermé),
       regle (vrai : règle graduée à gauche de la plaque), duree (s à vitesse × 1, défaut 10),
       marges: { g, d } (cm ajoutés à gauche et à droite de la cuve, pour des légendes ; plaque seule : d),
       onFront(front), onFin()
   Contrôleur : {
     svg, etat,                         état courant (lecture)
     maj(options)                       change des options et redessine
     toucherTache(fn)                   fn appelée au toucher d'une tache (comme onTache)
     taches()                           [{ cle, depot, espece, h, x, y }] (x, y en unités SVG)
     tacheProche(evt, rayon)            tache la plus proche d'un événement pointeur (rayon en cm, défaut 0,9)
     versPlaque(evt) → { x, y }         point du pointeur en cm sur la plaque
     geo                                { k, px(xcm), py(ycm) } : conversion cm → SVG
     lecture(), pause(), vitesse(v), recommencer(), etapeSuivante(), enCours(), fini()   (élution)
     dissoudre(fin)                     les dépôts se dissolvent dans l'éluant (animation)
   }
   CCM.analyser(depots, references) → [{ nom, taches: [h], nbTaches, pur,
                                         constituants: [i], absents: [i], inconnues: [h] }]
     constituants / absents : indices des références dont la tache est (ou n'est pas)
     à la même hauteur qu'une tache du dépôt ; inconnues : hauteurs des taches
     qu'aucune référence n'explique.

   Exemple :
     const p = CCM.plaque(zone, { depots: [{ nom: 'A', especes: ['e1'] }, { nom: 'M', especes: ['e1', 'e2'] }],
                                  interactif: true, pointilles: 'selection' });
     p.toucherTache(t => p.maj({ selection: [t.cle] }));
   Plusieurs plaques et animations peuvent exister dans la même page (aucun état global).
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const R = 0.22;                         // rayon d'une tache (cm)
  let numero = 0;                         // identifiants uniques des filtres SVG

  /* ---------- Espèces ---------- */
  const ESPECES = {
    // fictives (animation) : A et C colorées, B, D et X incolores
    A: { nom: 'A', h: .72, couleur: true },
    B: { nom: 'B', h: .30 },
    C: { nom: 'C', h: .48, couleur: true },
    D: { nom: 'D', h: .86 },
    X: { nom: 'X', h: .14 },
    F: { nom: 'F', h: .60 },              // rapport frontal (« Pour aller plus loin »)
    // fictives (lecture d'un chromatogramme)
    e1: { nom: 'e1', h: .80 }, e2: { nom: 'e2', h: .26 }, e3: { nom: 'e3', h: .52 }, e4: { nom: 'e4', h: .66 },
    e5: { nom: 'e5', h: .40 }, e6: { nom: 'e6', h: .12 }, e7: { nom: 'e7', h: .92 },
    // réelles : menthe poivrée, pastille rafraîchissante, huile essentielle d'orange
    menthol: { nom: 'menthol', h: .22, le: 'le menthol', du: 'du menthol', de: 'de menthol' },
    eucalyptol: { nom: 'eucalyptol', h: .45, le: 'l\'eucalyptol', du: 'de l\'eucalyptol', de: 'd\'eucalyptol' },
    menthone: { nom: 'menthone', h: .70, g: 'f', le: 'la menthone', du: 'de la menthone', de: 'de menthone' },
    menthofuranne: { nom: 'menthofuranne', h: .90, le: 'le menthofuranne', du: 'du menthofuranne', de: 'de menthofuranne' },
    citral: { nom: 'citral', h: .33, le: 'le citral', du: 'du citral', de: 'de citral' },
    limonene: { nom: 'limonène', h: .82, le: 'le limonène', du: 'du limonène', de: 'de limonène' },
    carvone: { nom: 'carvone', h: .58, g: 'f', le: 'la carvone', du: 'de la carvone', de: 'de carvone' },
    myrcene: { nom: 'myrcène', h: .94, le: 'le myrcène', du: 'du myrcène', de: 'de myrcène' },
    // réelles : médicaments
    ibuprofene: { nom: 'ibuprofène', h: .75, le: 'l\'ibuprofène', du: 'de l\'ibuprofène', de: 'd\'ibuprofène' },
    aspirine: { nom: 'aspirine', h: .50, g: 'f', le: 'l\'aspirine', du: 'de l\'aspirine', de: 'd\'aspirine' },
    paracetamol: { nom: 'paracétamol', h: .25, le: 'le paracétamol', du: 'du paracétamol', de: 'de paracétamol' },
    // espèces non identifiées des huiles essentielles et de la pastille
    u1: { nom: '?', h: .10 }, u2: { nom: '?', h: .57 }, u3: { nom: '?', h: .60 }, u4: { nom: '?', h: .70 }, u5: { nom: '?', h: .12 },
  };
  const hauteur = id => (ESPECES[id] ? ESPECES[id].h : 0.5);
  const meme = (a, b) => Math.abs(a - b) < 1e-6;

  // hauteurs relatives des taches d'un dépôt (deux espèces de même hauteur ne donnent qu'une tache)
  function hauteursDe(d) {
    const l = [];
    d.especes.forEach(s => { const h = hauteur(s); if (!l.some(x => meme(x, h))) l.push(h); });
    return l.sort((a, b) => a - b);
  }

  /* ---------- Analyse d'un chromatogramme ---------- */
  function analyser(depots, references) {
    const refs = (references || []).map(hauteursDe);
    return depots.map(d => {
      const t = hauteursDe(d);
      const constituants = [], absents = [];
      refs.forEach((hr, i) => (hr.length && hr.every(h => t.some(x => meme(x, h))) ? constituants : absents).push(i));
      const inconnues = t.filter(h => !refs.some(hr => hr.some(x => meme(x, h))));
      return { nom: d.nom, taches: t, nbTaches: t.length, pur: t.length === 1, constituants, absents, inconnues };
    });
  }

  /* ---------- Outils de dessin ---------- */
  const f = v => Math.round(v * 10) / 10;
  const cleDe = (i, s) => i + '|' + s;
  const ens = l => new Set(l || []);

  // trait ondulé du front de l'éluant (de x0 à x1, à la hauteur y), phase en radians
  function onde(x0, x1, y, amp, phase) {
    let d = '';
    for (let x = x0, n = 0; x <= x1 + .01; x += (x1 - x0) / 24, n++) d += (n ? 'L' : 'M') + f(x) + ',' + f(y + amp * Math.sin(x / 9 + phase));
    return d;
  }
  // cercle « à la main » au crayon (légèrement irrégulier)
  function cercleMain(cx, cy, rx, ry) {
    let d = '';
    for (let a = 0; a <= 2 * Math.PI + .5; a += Math.PI / 10) {
      const k = 1 + .06 * Math.sin(3 * a + 1);
      d += (d ? 'L' : 'M') + f(cx + rx * k * Math.cos(a)) + ',' + f(cy + ry * k * Math.sin(a));
    }
    return d;
  }

  /* ============================================================
     CŒUR : plaque seule ou scène avec la cuve
     ============================================================ */
  function creer(zone, o, mode) {
    const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = 'ccm' + (++numero);
    const e = Object.assign({
      depots: [], hauteur: 10, trait: 1, traitProgres: 1, noms: true, front: null, mouille: true, frontTrait: null,
      uv: false, rendu: 'labo', cercles: [], selection: [], marque: null, pointilles: false, interactif: false,
      echelle: mode === 'cuve' ? 28 : 30, cuve: mode === 'cuve', dansCuve: true, niveau: 0, couvercle: false, regle: false,
      duree: 10, aria: 'Plaque de chromatographie', calque: null,
    }, o);
    if (e.largeur == null) e.largeur = Math.max(3, e.depots.length + 1);
    let onTache = e.onTache || null;
    let enCours = false, vit = 1, dernier = 0, raf = 0, phase = 0, tDiss = 0;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ccm-svg');
    svg.setAttribute('role', 'img');
    zone.appendChild(svg);
    // dessin (redessiné) et éléments persistants (poignées)
    svg.innerHTML = '<g class="ccm-dessin"></g><g class="ccm-fixe"></g>';
    const gDessin = svg.firstChild, gFixe = svg.lastChild;
    // une poignée à glisser ne fait pas défiler la page (touch-action n'agit pas sur les éléments internes d'un SVG)
    svg.addEventListener('touchstart', ev => { if (ev.target.closest && ev.target.closest('.ccm-poignee')) ev.preventDefault(); }, { passive: false });

    /* ---- géométrie ---- */
    const geo = {};
    function calculer() {
      const k = e.echelle, L = e.largeur, Hp = e.hauteur;
      let gx, gy, W, H;
      if (mode === 'cuve') {
        // marges : règle à gauche, couvercle soulevé en haut
        const mg = (e.marges && e.marges.g) || 0, md = (e.marges && e.marges.d) || 0;
        gx = mg + 1.8 + .8; gy = 1.9 + .8; W = (mg + 1.8 + L + 1.6 + .5 + md) * k; H = (1.9 + Hp + .8 + .5) * k;
        geo.cuve = { x: (mg + 1.8) * k, y: 1.9 * k, w: (L + 1.6) * k, h: (Hp + .8) * k };
      } else {
        gx = e.regle ? 1.4 : .3; gy = .3; W = (gx + L + .3 + ((e.marges && e.marges.d) || 0)) * k; H = (Hp + .6) * k;
      }
      geo.k = k; geo.W = W; geo.H = H;
      geo.px = x => (gx + x) * k;
      geo.py = y => (gy + Hp - y) * k;
      geo.L = L; geo.Hp = Hp;
      svg.setAttribute('viewBox', `0 0 ${f(W)} ${f(H)}`);
    }
    const frontFinal = () => e.hauteur - 1;
    const valFront = () => (e.front === 'final' ? frontFinal() : e.front);
    const valFrontTrait = () => (e.frontTrait === 'final' ? frontFinal() : e.frontTrait);
    const xDepot = i => (e.depots[i].x != null ? e.depots[i].x : (i + 1) * e.largeur / (e.depots.length + 1));

    // position (cm) des taches : chaque espèce monte à sa hauteur relative du chemin parcouru par le front
    function positions() {
      const fr = e.rendu === 'figure' && e.front == null ? frontFinal() : valFront();
      const t = e.trait == null ? 1 : e.trait;
      const monte = fr == null ? 0 : Math.max(0, fr - t);
      const l = [];
      e.depots.forEach((d, i) => {
        const vus = [];
        d.especes.forEach(s => {
          const h = hauteur(s);
          if (vus.some(x => meme(x, h))) return;
          vus.push(h);
          l.push({ cle: cleDe(i, s), depot: i, espece: s, h, xc: xDepot(i), yc: t + h * monte, x: geo.px(xDepot(i)), y: geo.py(t + h * monte), couleur: !!(ESPECES[s] && ESPECES[s].couleur) });
        });
      });
      return l;
    }

    /* ---- dessin de la plaque ---- */
    function dessinPlaque() {
      const k = geo.k, X = geo.px, Y = geo.py, L = e.largeur, Hp = e.hauteur;
      const fr = valFront();
      let s = `<rect class="ccm-plaque${e.uv ? ' uv' : ''}" x="${f(X(0))}" y="${f(Y(Hp))}" width="${f(L * k)}" height="${f(Hp * k)}" rx="2"/>`;
      // partie mouillée par l'éluant, bord supérieur ondulé
      if (fr != null && fr > 0 && e.mouille && !e.uv) {
        const yf = Y(Math.min(fr, Hp)), amp = enCours ? .05 * k : .03 * k;
        s += `<path class="ccm-mouille" d="${onde(X(0), X(L), yf, amp, phase)} L${f(X(L))},${f(Y(0))} L${f(X(0))},${f(Y(0))} Z"/>`;
        s += `<path class="ccm-front-bord" d="${onde(X(0), X(L), yf, amp, phase)}"/>`;
      }
      // trait de dépôt (en cours de tracé : partiel) et trait du front, au crayon
      if (e.trait != null && e.traitProgres > 0) s += `<line class="ccm-crayon" x1="${f(X(.25))}" y1="${f(Y(e.trait))}" x2="${f(X(.25 + (L - .5) * e.traitProgres))}" y2="${f(Y(e.trait))}"/>`;
      const ft = valFrontTrait();
      if (ft != null) s += `<line class="ccm-crayon" x1="${f(X(.25))}" y1="${f(Y(ft))}" x2="${f(X(L - .25))}" y2="${f(Y(ft))}"/>`;
      // noms des dépôts sous le trait
      if (e.noms && e.trait != null) e.depots.forEach((d, i) => {
        s += `<text class="ccm-nom" x="${f(X(xDepot(i)))}" y="${f(Y(e.trait) + .62 * k)}" font-size="${f(.42 * k)}">${d.nom}</text>`;
      });
      const pos = positions();
      const cer = ens(e.cercles), sel = ens(e.selection);
      // pointillés entre taches de même hauteur (de dépôts différents)
      if (e.pointilles) {
        const choix = e.pointilles === 'tous' ? pos : pos.filter(p => sel.has(p.cle));
        const groupes = [];
        choix.forEach(p => { const g = groupes.find(x => meme(x.h, p.h)); if (g) g.l.push(p); else groupes.push({ h: p.h, l: [p] }); });
        groupes.filter(g => new Set(g.l.map(p => p.depot)).size > 1).forEach(g => {
          const xs = g.l.map(p => p.x);
          s += `<line class="ccm-pointilles" x1="${f(Math.min(...xs) + R * k * 1.3)}" y1="${f(g.l[0].y)}" x2="${f(Math.max(...xs) - R * k * 1.3)}" y2="${f(g.l[0].y)}"/>`;
        });
      }
      // taches
      const r = R * k;
      pos.forEach(p => {
        const d = e.depots[p.depot], diss = d.dissous || 0;
        const visible = e.rendu === 'figure' || p.couleur || e.uv;
        const pasParti = fr == null || fr <= (e.trait == null ? 1 : e.trait);
        if (visible) {
          const cls = e.rendu === 'figure' ? 'ccm-tache-i' : p.couleur && !e.uv ? 'ccm-tache-c' : 'ccm-tache-i';
          const rr = (pasParti && e.rendu !== 'figure' ? r * .7 : r) * (1 + 2.5 * diss);
          s += `<ellipse class="${cls}" cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(rr * 1.15)}" ry="${f(rr * .9)}" opacity="${f(1 - .95 * diss)}" filter="url(#${id}-flou)"/>`;
        } else if (pasParti && e.trait != null) {
          // dépôt d'une espèce incolore : petite marque à peine visible
          s += `<circle class="ccm-depot" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r * .45 * (1 + 2.5 * diss))}" opacity="${f(1 - .95 * diss)}"/>`;
        }
        if (cer.has(p.cle)) s += `<path class="ccm-cercle" d="${cercleMain(p.x, p.y, r * 1.75, r * 1.5)}"/>`;
        if (sel.has(p.cle)) s += `<ellipse class="ccm-sel" cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(r * 1.9)}" ry="${f(r * 1.6)}"/>`;
        if (e.marque === p.cle) s += `<ellipse class="ccm-marque" cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(r * 2.3)}" ry="${f(r * 1.9)}"/>`;
      });
      return s;
    }

    /* ---- règle graduée (cm) à gauche de la plaque ---- */
    function dessinRegle() {
      const k = geo.k, x = geo.px(0) - .25 * k;
      let s = `<rect class="ccm-regle" x="${f(x - .9 * k)}" y="${f(geo.py(e.hauteur) - 2)}" width="${f(.9 * k)}" height="${f(e.hauteur * k + 4)}" rx="3"/>`;
      for (let mm = 0; mm <= e.hauteur * 10; mm++) {
        const y = geo.py(mm / 10), l = mm % 10 === 0 ? .4 : mm % 5 === 0 ? .28 : .16;
        s += `<line class="ccm-grad" x1="${f(x - l * k)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y)}"/>`;
        if (mm % 10 === 0) s += `<text class="ccm-grad-t" x="${f(x - .5 * k)}" y="${f(y + .14 * k)}" font-size="${f(.36 * k)}">${mm / 10}</text>`;
      }
      return s;
    }

    /* ---- cuve, éluant, couvercle ---- */
    function dessinCuveFond() {
      const c = geo.cuve;
      return `<path class="ccm-cuve-fond" d="M${f(c.x)},${f(c.y)} L${f(c.x)},${f(c.y + c.h - 8)} Q${f(c.x)},${f(c.y + c.h)} ${f(c.x + 8)},${f(c.y + c.h)} L${f(c.x + c.w - 8)},${f(c.y + c.h)} Q${f(c.x + c.w)},${f(c.y + c.h)} ${f(c.x + c.w)},${f(c.y + c.h - 8)} L${f(c.x + c.w)},${f(c.y)} Z"/>`;
    }
    function dessinEluant() {
      const c = geo.cuve;
      if (!(e.niveau > 0)) return '';
      // la plaque repose sur le fond de la cuve : le niveau se mesure depuis le bas de la plaque
      const yN = geo.py(e.niveau), yB = c.y + c.h;
      return `<path class="ccm-eluant" d="M${f(c.x + 1)},${f(yN)} L${f(c.x + c.w - 1)},${f(yN)} L${f(c.x + c.w - 1)},${f(yB - 8)} Q${f(c.x + c.w - 1)},${f(yB - 1)} ${f(c.x + c.w - 8)},${f(yB - 1)} L${f(c.x + 8)},${f(yB - 1)} Q${f(c.x + 1)},${f(yB - 1)} ${f(c.x + 1)},${f(yB - 8)} Z"/>
        <line class="ccm-eluant-surface" x1="${f(c.x + 1)}" y1="${f(yN)}" x2="${f(c.x + c.w - 1)}" y2="${f(yN)}"/>`;
    }
    function dessinVerre() {
      const c = geo.cuve;
      return `<path class="ccm-verre" d="M${f(c.x)},${f(c.y)} L${f(c.x)},${f(c.y + c.h - 8)} Q${f(c.x)},${f(c.y + c.h)} ${f(c.x + 8)},${f(c.y + c.h)} L${f(c.x + c.w - 8)},${f(c.y + c.h)} Q${f(c.x + c.w)},${f(c.y + c.h)} ${f(c.x + c.w)},${f(c.y + c.h - 8)} L${f(c.x + c.w)},${f(c.y)}"/>`;
    }
    function dessinCouvercle() {
      const c = geo.cuve, k = geo.k, w = c.w + .5 * k, x = c.x - .25 * k, ep = .28 * k;
      if (e.couvercle) return `<rect class="ccm-couvercle" x="${f(x)}" y="${f(c.y - ep)}" width="${f(w)}" height="${f(ep)}" rx="3"/>`;
      // ouvert : soulevé et penché
      return `<rect class="ccm-couvercle ouvert" x="${f(x)}" y="${f(c.y - ep - 1.1 * k)}" width="${f(w)}" height="${f(ep)}" rx="3" transform="rotate(-7 ${f(x + w)} ${f(c.y - 1.1 * k)})"/>`;
    }

    function rendre() {
      calculer();
      svg.setAttribute('aria-label', e.aria);
      let s = `<defs><filter id="${id}-flou" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${f(.07 * geo.k)}"/></filter></defs>`;
      if (mode === 'cuve' && e.cuve) s += dessinCuveFond();
      if (e.regle) s += dessinRegle();
      s += `<g class="${mode === 'cuve' && e.cuve && !e.dansCuve ? 'ccm-attente' : ''}">${dessinPlaque()}</g>`;
      if (mode === 'cuve' && e.cuve) s += dessinEluant() + dessinVerre() + dessinCouvercle();
      if (e.calque) s += e.calque(geo);
      gDessin.innerHTML = s;
      if (e.fixe) e.fixe(geo, gFixe);
    }

    /* ---- élution ---- */
    function boucle(t) {
      if (!enCours) return;
      const dt = Math.min(.1, (t - (dernier || t)) / 1000);
      dernier = t;
      const depart = e.niveau || 0, fin = frontFinal();
      let fr = e.front == null ? depart : valFront();
      fr = Math.min(fin, fr + dt * vit * (fin - depart) / e.duree);
      e.front = fr;
      phase += dt * vit * 3;
      rendre();
      if (e.onFront) e.onFront(fr);
      if (fr >= fin - 1e-9) { enCours = false; rendre(); if (e.onFin) e.onFin(); return; }
      raf = requestAnimationFrame(boucle);
    }
    const ctrl = {
      svg, geo,
      get etat() { return e; },
      maj(opts) { Object.assign(e, opts || {}); if (opts && opts.onTache) onTache = opts.onTache; rendre(); },
      toucherTache(fn) { onTache = fn; },
      taches() { calculer(); return positions().map(p => ({ cle: p.cle, depot: p.depot, espece: p.espece, h: p.h, x: p.x, y: p.y })); },
      versPlaque(ev) {
        const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const m = svg.getScreenCTM();
        const q = m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
        return { x: q.x / geo.k - (geo.px(0) / geo.k), y: (geo.py(0) - q.y) / geo.k };
      },
      tacheProche(ev, rayon) {
        const p = ctrl.versPlaque(ev);
        let best = null, dmin = rayon || .9;
        positions().forEach(t => { const d = Math.hypot(t.xc - p.x, t.yc - p.y); if (d < dmin) { dmin = d; best = t; } });
        return best ? { cle: best.cle, depot: best.depot, espece: best.espece, h: best.h } : null;
      },
      lecture() {
        if (enCours) return;
        if (reduit) { ctrl.etapeSuivante(); return; }
        if (valFront() != null && valFront() >= frontFinal() - 1e-9) return;
        enCours = true; dernier = 0; raf = requestAnimationFrame(boucle);
      },
      pause() { enCours = false; cancelAnimationFrame(raf); rendre(); },
      vitesse(v) { vit = v; },
      recommencer() { enCours = false; cancelAnimationFrame(raf); e.front = null; rendre(); },
      // sans animation : le front avance d'un quart du chemin, état final de l'étape
      etapeSuivante() {
        const depart = e.niveau || 0, fin = frontFinal(), pas = (fin - depart) / 4;
        const fr = e.front == null ? depart : valFront();
        e.front = Math.min(fin, Math.round((fr + pas - depart) / pas) * pas + depart);
        rendre();
        if (e.onFront) e.onFront(e.front);
        if (e.front >= fin - 1e-9 && e.onFin) e.onFin();
      },
      enCours: () => enCours,
      fini: () => valFront() != null && valFront() >= frontFinal() - 1e-9,
      // les dépôts s'étalent et disparaissent dans l'éluant
      dissoudre(fin) {
        if (reduit) { e.depots.forEach(d => { d.dissous = 1; }); rendre(); if (fin) fin(); return; }
        tDiss = 0;
        let t0 = 0;
        const pas = t => {
          if (!t0) t0 = t;
          tDiss = Math.min(1, (t - t0) / 1800);
          e.depots.forEach(d => { d.dissous = tDiss; });
          rendre();
          if (tDiss < 1) requestAnimationFrame(pas); else if (fin) fin();
        };
        requestAnimationFrame(pas);
      },
    };

    // toucher d'une tache (appui court, sans glisser)
    if (e.interactif) {
      let dep = null;
      svg.addEventListener('pointerdown', ev => { dep = { x: ev.clientX, y: ev.clientY }; });
      svg.addEventListener('pointerup', ev => {
        if (!dep || Math.hypot(ev.clientX - dep.x, ev.clientY - dep.y) > 12) { dep = null; return; }
        dep = null;
        const t = ctrl.tacheProche(ev);
        if (t && onTache) onTache(t);
      });
      svg.classList.add('ccm-interactif');
    }
    rendre();
    return ctrl;
  }

  const plaque = (zone, o) => creer(zone, Object.assign({ front: 'final', frontTrait: 'final', rendu: 'figure', mouille: false }, o), 'seule');
  const animation = (zone, o) => creer(zone, o, 'cuve');

  window.CCM = { ESPECES, hauteur, hauteursDe, analyser, plaque, animation };
})();
