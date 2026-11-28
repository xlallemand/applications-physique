/* ============================================================
   Éditeur d'équations partagé (objet EQ) — outil commun des applications
   (Terminale spécialité, STI2D…), styles assets/equations.css.

   Origine : l'éditeur à tuiles de l'application « Équations en physique
   (smartphone) » (equations-physique-mobile/modules/editeur.js, aide-rules.js,
   tuiles.js, ecriture.js), repris sans changer son comportement : mêmes gestes,
   mêmes outils (fraction, parenthèses, ×(−1), fonctions réciproques sqrt/x²,
   x³/∛, xⁿ/x^(1/n), sin/Arcsin, cos/Arccos, tan/Arctan, log/10ˣ, ln/eˣ, 1/x),
   mêmes aides et messages, « ↶ Annuler », « ↺ Recommencer », « ✓ Vérifier
   l'étape » (l'équation obtenue est testée avec des valeurs tirées au hasard) ;
   la question est finie quand la grandeur cherchée est seule, à gauche, sans 1
   inutile. Il remplace l'ancien éditeur ph/modules/eq.js (PH.Editeur, PH.demo).
   Différence : l'outil se monte en PLUSIEURS EXEMPLAIRES dans une page (état
   propre à chaque éditeur, aucun id, aucun code dans le HTML) : « Afficher tout
   le cours » peut déplier tous les « À toi » d'un cours.

   Modèle d'un membre de l'équation (nœuds, EQ.noeuds) :
     { kind:'seq', slots:[…] }              produit de zones multipliées entre elles
     { kind:'simple', items:[tuile…] }      zone de tuiles { id, label, pow? } ('one' : le nombre 1)
                                            label : HTML ; une lettre seule passe en italique (grandeur),
                                            sauf dans <span class="eq-droit"> (espèce chimique : [H₃O⁺])
     { kind:'frac', num, den }              fraction
     { kind:'sum', terms:[{ sign, node }] } somme signée de termes
     { kind:'func', fn, n?, inner }         fonction : sq, sqrt, cube, cbrt, pow (n), proot (1/n),
                                            sin, asin, cos, acos, tan, atan, log, pow10, ln, exp

   Écriture compacte d'une équation (grandeurs désignées par leur identifiant, g = { id: libellé }) :
     'Ec = [1|2] m v^2'          [num|den] : fraction ; facteurs séparés par des espaces
     'pH = - log(c)'             fonctions : sqrt cbrt sin cos tan asin acos atan log ln exp p10 rootN( )
     'N = N0 exp(- lambda t)'    1 : le nombre 1 ; un autre nombre est une grandeur déclarée (deux : '2')

   API :
     EQ.monter(zone, exercice, rappels) → { montrer(etapes), fin(), detruire(), racine, ops }
        affiche un éditeur dans zone (vidée) ;
        exercice : { tiles:[tuile], initialLeft(), initialRight(), targetId, sample(),
                     funcTools:['pow10', 'log', 'inv', 'pow:4'…], needsParenTool,
                     aides:['…'] (facultatif : bouton « Un coup de pouce ? », une aide par étape validée),
                     messages:{ CLE: 'texte' } (facultatif : remplace un message de EQ.MESSAGES) }
        rappels  : { surErreur(), surEtape(), surResolu(), surMessage(element), surRemplacement(id) }
        montrer(etapes) : l'éditeur se fige et affiche la correction (démonstration EQ.demo
                          toute dépliée si etapes = { etapes, g } est donné)
     ops.remplacements([{ id, label, noeud }]) : outils « grandeur = expression » changés en cours de route
        (combiner des équations : une grandeur isolée dans une équation se reporte dans les autres)
     EQ.exercice({ eq, g, cible, valeurs, outils, parentheses, aides, messages, tuiles })
        → exercice pour EQ.monter, à partir de l'écriture compacte (eq), des libellés (g),
          de la grandeur à isoler (cible), des valeurs de test (valeurs() → { id: valeur }),
          des outils de la réserve (outils, comme funcTools) ; tuiles : grandeurs en plus dans la réserve ;
        options de SIMPLIFICATION d'une expression (toutes facultatives, sans effet sur les autres exercices) :
          remplacements: [{ id, par }]  outils « grandeur = expression » (par : écriture compacte), à déposer
                                        sur la grandeur ; une fraction de grandeurs se répartit de part et
                                        d'autre du trait (E = U / L : U prend la place de E, L passe de l'autre côté)
          racineOuverte: true           un facteur (ou un dénominateur entier) glissé sur une racine y entre
                                        au carré ; les grandeurs de la racine se choisissent (simplifier)
          simplifier: true              simplifier en deux appuis : une grandeur touchée (sélection), puis la
                                        même touchée de l'autre côté du trait de la même fraction → les deux se
                                        barrent, une couleur par paire ; avec des puissances, ce sont elles qui
                                        sont barrées, la nouvelle écrite au-dessus (rien si 1) : q² / q → q.
                                        Plusieurs paires à la suite ; « ✓ Vérifier l'étape » efface les termes
                                        barrés (avant, aucune autre transformation). Une bulle explique le geste
                                        la première fois. Option de l'éditeur partagé : utilisable dans toute
                                        application (equations-physique-mobile, equations-en-physique…), seule
                                        ou avec remplacements (combiner des équations : grandeur = expression)
          simplifierMembres: true       avec simplifier : la même grandeur en facteur dans les deux membres, à la même
                                        place (en haut des deux côtés, ou en bas), se simplifie aussi en deux appuis
                                        (m g = G M m / R² : on divise les deux membres par m)
          controle(etat) → { fini } | { message }   contrôle de fin propre à l'exercice, après chaque étape juste
                                        (combiner des équations : grandeurs permises, forme simplifiée)
          forme: 'v = sqrt([deux q U|m])'  forme finale attendue (ordre des facteurs indifférent) : fin de l'exercice
          reserveSeule, objectif, consigne : réserve réduite aux outils ; textes au-dessus de l'équation
     EQ.partie(exercice, opts) → partie 'perso' du moteur de cours COURS (« À toi ») et des séries
        opts : { q, solution (HTML après la réponse), etapes (correction : étapes de EQ.demo), g }
        réussie quand la grandeur est isolée (api.reussi()), chaque erreur compte (api.compterErreur()).
     EQ.demo(zone, { etapes, g, tout, onFini }) → démonstration étape par étape (remplace PH.demo)
        etapes : [{ gauche, droite } (nœuds) ou { eq } (écriture compacte, avec g),
                  op (opération faite sur les deux membres, flèches), centre (remarque : ⇄…),
                  texte (explication sous la ligne), final (ligne du résultat, encadrée)}]
        boutons « Étape suivante ↓ » et « Tout afficher » ; tout : tout déplié d'emblée ;
        avec le moteur COURS, « Afficher tout le cours » la déplie (COURS.vivant).
     EQ.lire(texte, g) → { left, right }   EQ.membre(texte, g)   EQ.tuilesDe({ left, right })
     EQ.statique(noeud), EQ.ligne(gauche, droite) : écriture figée (HTML) ;
        EQ.finir(element) une fois ce HTML dans la page (crochets des racines, parenthèses)
     EQ.evaluer(noeud, valeurs), EQ.noeuds, EQ.libelleOutil(t), EQ.noteOutil(t)
     EQ.MESSAGES : messages par défaut (règles de déplacement, VIDE, INCHANGE, FAUX, RECIPROQUE,
        MSG_FONCTION, MSG_PAREN) ; EQ.regles : règles de déplacement (chemins left/right…)

   Chargé après assets/dragdrop.js ; avec assets/equations.css.
   ============================================================ */
(function () {
  'use strict';
  if (window.EQ) return;          // déjà chargé dans la page

  /* ============================================================
     1. RÈGLES DE DÉPLACEMENT (aide-rules.js de l'application mobile)
     Un chemin désigne l'emplacement d'un élément : "left", "left.num",
     "right.0.den"… Le niveau d'un élément est celui de la fraction la plus
     proche : ".num" (numérateur), ".den" (dénominateur) ou "flat".
     ============================================================ */
  const REGLES = (function () {

    function side(path) { return path.split('.')[0]; }
    // niveau donné par la fraction la plus proche : un élément d'une zone
    // d'un numérateur ou d'un dénominateur (ex. "left.0.den.1") en fait partie
    function level(path) {
        const p = path.split('.');
        for (let i = p.length - 1; i > 0; i--) {
            if (p[i] === 'num' || p[i] === 'den') return p[i];
            if (/^term\d+$/.test(p[i])) break;
        }
        return 'flat';
    }
    // au niveau "flat" ou "num", un terme se comporte comme un numérateur
    // (implicitement sur 1 s'il n'est pas dans une fraction)
    function isNumeratorLevel(lvl) { return lvl !== 'den'; }

    // déplacement d'une tuile multiplicative (type 'move') :
    // - toujours autorisé si la case d'arrivée est la même que le départ
    // - du même côté de l'équation : autorisé seulement entre deux positions
    //   de même niveau (numérateur/flat entre eux, ou dénominateur entre eux) —
    //   ex. faire entrer/sortir un facteur du numérateur d'une fraction
    //   voisine, ou faire passer un terme d'un dénominateur à un autre
    //   dénominateur multiplié sur le même côté
    // - de l'autre côté de l'équation : autorisé seulement en changeant de
    //   niveau (numérateur <-> dénominateur), ce qui revient à multiplier ou
    //   diviser les deux côtés de l'équation par ce terme
    function isLegalMove(fromPath, toPath) {
        if (fromPath === toPath) return true;
        const fs = side(fromPath), ts = side(toPath);
        const fNum = isNumeratorLevel(level(fromPath));
        const tNum = isNumeratorLevel(level(toPath));
        return fs === ts ? fNum === tNum : fNum !== tNum;
    }

    // sortie d'un terme hors d'une fraction pour devenir un facteur
    // multiplié à côté (zone d'insertion) : seul le numérateur peut sortir,
    // et cela reste du même côté de l'équation
    function isLegalInsert(fromPath, destSidePath) {
        if (side(fromPath) !== side(destSidePath)) return false;
        return level(fromPath) !== 'den';
    }

    // déplacement d'un terme additif (+ ou -) : toujours de l'autre côté
    function isLegalSumTerm(fromPath, destSidePath) {
        return side(fromPath) !== side(destSidePath);
    }

    // dépôt de l'outil fraction (icône "···/···") : uniquement sur un
    // emplacement "flat" (jamais à l'intérieur d'un numérateur ou d'un
    // dénominateur déjà existant)
    function isLegalFracTool(destPath) {
        return level(destPath) === 'flat';
    }

    const MSG_MOVE = "Déplacement non autorisé. Règle à suivre : un terme multiplicatif ne peut passer que de l'autre côté de l'équation, en changeant de position (du numérateur vers le dénominateur, ou du dénominateur vers le numérateur) — cela revient à multiplier ou diviser les deux côtés de l'équation par ce terme.";
    const MSG_MOVE_FRAC = "Déplacement non autorisé. Règle à suivre : un terme multiplicatif peut rejoindre un numérateur (ou une position à côté d'une fraction) ou un dénominateur déjà présent du même côté ; il ne peut passer d'un numérateur à un dénominateur (ou inversement) qu'en changeant de côté de l'équation.";
    const MSG_INSERT = "Déplacement non autorisé. Règle à suivre : seul un terme placé au numérateur d'une fraction peut en sortir pour devenir un facteur multiplié à côté d'elle, et il doit rester du même côté de l'équation.";
    const MSG_SUMTERM = "Déplacement non autorisé. Règle à suivre : un terme précédé de + ou − ne peut que passer de l'autre côté de l'équation ; il change alors de signe (+ devient −, et inversement).";
    const MSG_FRAC = "Déplacement non autorisé. Règle à suivre : l'outil fraction ne peut être utilisé que sur un emplacement qui n'est pas déjà le numérateur ou le dénominateur d'une fraction.";
    const MSG_FRACDEN = "Déplacement non autorisé. Règle à suivre : le dénominateur ne peut rejoindre que l'autre côté de l'équation (cela revient à multiplier les deux côtés par ce dénominateur, ce qui le supprime d'un côté et l'ajoute comme facteur de l'autre).";

    return {
        side, level, isLegalMove, isLegalInsert, isLegalSumTerm, isLegalFracTool,
        MSG_MOVE, MSG_MOVE_FRAC, MSG_INSERT, MSG_SUMTERM, MSG_FRAC, MSG_FRACDEN,
    };  })();

  /* ============================================================
     2. COMPORTEMENT COMMUN DES TUILES (tuiles.js de l'application mobile)
     Effacer un élément (appui puis croix noire ✕, ou dépôt dans la réserve),
     retour en place animé, arrivée signalée, grandeurs en italique, clavier
     (Tab, Entrée, Suppr, Échap), historique « ↶ Annuler ». Une seule
     sélection dans la page ; gestionnaires installés une fois pour la page.
     ============================================================ */
  const EPT = (function () {

    const SEUIL = 8;
    // action en plusieurs temps (historique : une seule entrée)
    let groupe = 0, enGroupe = false;          // déplacement (px) au-delà duquel un appui devient un glisser
    const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── outils ──
    // élément activé par assets/dragdrop.js (il reçoit touch-action: none en style)
    function glissable(cible) {
      for (let n = cible; n && n !== document.body; n = n.parentElement) {
        if (n.dataset && n.dataset.eptBloque) return null;      // ne se déplace pas (EPT.bloquer)
        if (n.style && n.style.touchAction === 'none') return n;
      }
      return null;
    }
    // texte d'une tuile, sans la croix
    const texte = el => el.textContent.replace(/✕/g, '').replace(/\s+/g, '').trim();
    // repère stable d'une tuile ou d'une case : l'éditeur redessine l'équation
    // à chaque changement, l'élément est alors retrouvé par son chemin
    function signature(el) {
      const p = el.closest('[data-path]');
      return (p ? p.dataset.path : '') + '|' + (el.dataset.idx || '') + '|' + (el.classList.contains('slot-simple') ? 'case' : 'tuile');
    }
    function retrouver(el, zone) {
      if (el.isConnected) return el;
      if (!zone || !zone.isConnected) return null;
      const s = signature(el);
      return [...zone.querySelectorAll('.eq-tile, .slot-simple')].find(n => signature(n) === s) || null;
    }
    // case d'un dénominateur et commande de suppression de sa fraction
    const caseDen = wrap => wrap && wrap.querySelector(':scope > .slot-simple');
    const croixDen = wrap => wrap && wrap.querySelector(':scope > .frac-del');
    // la case est-elle tout le dénominateur d'une fraction ?
    const estDen = c => !!(c.parentElement && c.parentElement.classList.contains('frac-den-wrap'));
    // commande de suppression d'une case vide : celle de sa fraction (dénominateur)
    // ou la sienne (facteur vide d'un produit, terme vide d'une somme)
    const croixCase = c => (estDen(c) && croixDen(c.parentElement)) || c.querySelector(':scope > .frac-del');
    // case vide qu'on peut supprimer
    function caseVide(cible) {
      if (!cible || cible.closest('.eq-tile, .ep-fige')) return null;
      const c = cible.closest('.slot-simple') || caseDen(cible.closest('.frac-den-wrap'));
      if (!c || c.querySelector('.eq-tile') || !croixCase(c)) return null;
      return c;
    }
    // tuile de l'équation qu'on peut effacer
    function tuileEffacable(cible) {
      const t = cible && cible.closest('.eq-tile');
      if (!t || t.closest('.ep-fige, .drag-ghost') || !t.querySelector('.tile-del') || t.dataset.eptBloque) return null;
      return t;
    }
    // tuile qu'on peut seulement choisir, sans croix (simplification : grandeur sous une racine,
    // grandeur dont la puissance vient d'être barrée) ; marquée data-ept-choix par l'éditeur
    function tuileChoix(cible) {
      const t = cible && cible.closest && cible.closest('[data-ept-choix]');
      return t && !t.closest('.ep-fige, .drag-ghost') ? t : null;
    }
    // écouteurs des éditeurs : paire(a, b) → true si le second appui a été pris (simplification) ;
    // choix(el) : un élément vient d'être sélectionné
    const ecouteurs = [];
    const paire = (a, b) => ecouteurs.some(f => f.paire && f.paire(a, b));
    // réserve (palette) de l'éditeur d'une tuile
    function reserveDe(el) {
      const ed = el.closest('.ep-edit');
      return ed ? ed.querySelector('.ep-palette') : document.getElementById('palette');
    }

    // ── effacement : par les commandes de la page ──
    function effacerMaintenant(el) {
      const zone = el.closest('.eq-row');
      if (el.classList.contains('slot-simple')) {
        const x = croixCase(el);
        if (x) x.click();
        return;
      }
      const wrap = el.parentElement && el.parentElement.closest('.frac-den-wrap');
      const c = caseDen(wrap);
      const seul1 = c && el.parentElement === c && c.querySelectorAll(':scope > .eq-tile').length === 1 && texte(el) === '1';
      // le 1 seul au dénominateur : la fraction disparaît
      if (seul1 && croixDen(wrap)) { croixDen(wrap).click(); return; }
      const chemin = c && c.dataset.path;
      const x = el.querySelector('.tile-del');
      groupe++; enGroupe = true;   // une seule action pour « ↶ Annuler », même en deux temps
      try {
        if (x) x.click();
        // page où un dénominateur vidé reste vide : on le supprime aussitôt
        if (seul1 && chemin && zone) {
          const c2 = zone.querySelector(`.slot-simple[data-path="${chemin}"]`);
          const w2 = c2 && c2.closest('.frac-den-wrap');
          if (c2 && !c2.querySelector('.eq-tile') && croixDen(w2)) croixDen(w2).click();
        }
      } finally { enGroupe = false; }
    }
    function effacer(el) {
      deselectionner();
      if (REDUIT || !el.classList.contains('eq-tile')) { effacerMaintenant(el); return; }
      el.classList.add('ept-part');
      setTimeout(() => { if (el.isConnected) effacerMaintenant(el); }, 150);
    }

    // ── sélection (une seule à la fois dans la page) ──
    let selection = null;     // { el, croix }
    function deselectionner() {
      if (!selection) return;
      selection.el.classList.remove('ept-sel');
      if (selection.croix) selection.croix.remove();
      selection = null;
    }
    function selectionner(el) {
      deselectionner();
      // tuile qu'on choisit seulement (simplification) : pas de croix
      if (el.dataset.eptChoix) {
        el.classList.add('ept-sel');
        selection = { el, croix: null };
        ecouteurs.forEach(f => f.choix && f.choix(el));
        return;
      }
      const croix = document.createElement('button');
      croix.type = 'button';
      croix.className = 'ept-croix';
      croix.textContent = '✕';
      const vide = el.classList.contains('slot-simple');
      croix.setAttribute('aria-label', vide ? (estDen(el) ? 'Supprimer le dénominateur' : 'Supprimer la case vide') : 'Effacer ' + texte(el));
      croix.title = croix.getAttribute('aria-label');
      // la croix ne commence pas de glisser la tuile qui la porte
      croix.addEventListener('pointerdown', e => e.stopPropagation());
      croix.addEventListener('click', e => { e.stopPropagation(); effacer(el); });
      el.classList.add('ept-sel');
      el.appendChild(croix);
      selection = { el, croix };
      ecouteurs.forEach(f => f.choix && f.choix(el));
    }
    function basculer(el) {
      if (selection && selection.el === el) deselectionner();
      else selectionner(el);
    }
    // second appui : après la sélection de « avant », un appui sur el (simplification en deux temps)
    function second(avant, el) {
      if (!avant || avant === el || el.classList.contains('slot-simple') || avant.classList.contains('slot-simple')) return false;
      return paire(avant, el);
    }

    // ── geste en cours (observé avant les gestionnaires des pages) ──
    let geste = null;
    document.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest && e.target.closest('.ept-croix')) return;
      const t = tuileEffacable(e.target) || tuileChoix(e.target);
      const d = !t && caseVide(e.target);
      // élément sélectionné avant cet appui (simplification : deux appuis successifs)
      const avant = selection ? selection.el : null;
      // un appui ailleurs que sur l'élément sélectionné annule la sélection
      if (selection && selection.el !== t && selection.el !== d) deselectionner();
      const item = glissable(e.target);
      geste = {
        id: e.pointerId, x: e.clientX, y: e.clientY, bouge: false,
        bloque: e.target.closest ? e.target.closest('[data-ept-bloque]') : null,
        appui: t || d || null, item, avant,
        zone: e.target.closest ? e.target.closest('.eq-row') : null,
        reserve: item && item.classList.contains('eq-tile') && tuileEffacable(item) ? reserveDe(item) : null,
        surReserve: false,
      };
    }, true);

    document.addEventListener('pointermove', e => {
      const g = geste;
      if (!g || e.pointerId !== g.id) return;
      if (!g.bouge && Math.hypot(e.clientX - g.x, e.clientY - g.y) > SEUIL) {
        g.bouge = true;
        // élément qui ne se déplace pas : il tremble, le message s'affiche tout de suite
        if (g.bloque && g.bloque.isConnected && g.bloque._eptBloque) {
          g.bloque.classList.remove('ept-refus');
          void g.bloque.offsetWidth;
          g.bloque.classList.add('ept-refus');
          g.bloque._eptBloque();
        }
        if (g.reserve) g.reserve.classList.add('ept-reserve-active');
      }
      if (!g.bouge || !g.reserve) return;
      // tuile de l'équation au-dessus de la réserve : elle sera effacée
      const sous = document.elementFromPoint(e.clientX, e.clientY);
      g.surReserve = !!(sous && g.reserve.contains(sous));
      g.reserve.classList.toggle('ept-reserve-survol', g.surReserve);
      const f = document.querySelector('.drag-ghost');
      if (f) f.classList.toggle('ept-efface', g.surReserve);
    }, true);

    function finGeste(e) {
      const g = geste;
      if (!g || e.pointerId !== g.id) return;
      geste = null;
      if (g.reserve) g.reserve.classList.remove('ept-reserve-active', 'ept-reserve-survol');
      if (e.type === 'pointercancel') return;
      const bouge = g.bouge || Math.hypot(e.clientX - g.x, e.clientY - g.y) > SEUIL;
      const lab = g.item ? texte(g.item) : '';
      const sig = g.item ? signature(g.item) : '';
      // après les gestionnaires de la page (dépôt, nouvel affichage)
      setTimeout(() => {
        if (!bouge) {
          if (!g.appui) return;
          const el = retrouver(g.appui, g.zone);
          if (!el || !(el.classList.contains('slot-simple') ? caseVide(el) : (tuileEffacable(el) || tuileChoix(el)))) return;
          const av = g.avant && retrouver(g.avant, g.zone);
          if (second(av, el)) return;      // deux grandeurs simplifiées : pas de nouvelle sélection
          basculer(el);
          return;
        }
        if (!g.item) return;
        if (g.surReserve && g.item.isConnected) { effacer(g.item); return; }
        if (g.item.isConnected) retour(g.item, e.clientX, e.clientY);
        else arrivee(e.clientX, e.clientY, lab, sig);
      }, 0);
    }
    document.addEventListener('pointerup', finGeste, true);
    document.addEventListener('pointercancel', finGeste, true);

    // ── élément lâché hors de toute case : il revient à sa place ──
    function retour(item, x, y) {
      if (REDUIT || item.closest('.ep-fige')) return;
      const r = item.getBoundingClientRect();
      if (!r.width) return;
      const f = item.cloneNode(true);
      f.classList.remove('dragging', 'ept-sel', 'ept-part');
      f.querySelectorAll('.ept-croix').forEach(c => c.remove());
      f.classList.add('drag-ghost', 'ept-retour');
      Object.assign(f.style, { position: 'fixed', margin: '0', width: r.width + 'px', height: r.height + 'px',
        left: (x - r.width / 2) + 'px', top: (y - r.height / 2) + 'px' });
      document.body.appendChild(f);
      item.classList.add('ept-attente');
      requestAnimationFrame(() => requestAnimationFrame(() => { f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; }));
      setTimeout(() => { f.remove(); item.classList.remove('ept-attente'); }, 230);
    }

    // ── élément déposé : il s'allume dans sa nouvelle case ──
    function arrivee(x, y, lab, sigDepart) {
      if (REDUIT || !lab) return;
      const sous = document.elementFromPoint(x, y);
      const zone = sous && sous.closest('.slot-simple, .eq-side, .sum-term, .eq-row');
      if (!zone) return;
      const t = [...zone.querySelectorAll('.eq-tile')].reverse().find(n => texte(n) === lab);
      if (!t || signature(t) === sigDepart) return;
      t.classList.add('ept-arrive');
      setTimeout(() => t.classList.remove('ept-arrive'), 500);
    }

    // ── clavier ──
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && selection) { deselectionner(); return; }
      const el = tuileEffacable(e.target) || tuileChoix(e.target) || (e.target.classList && e.target.classList.contains('slot-simple') && caseVide(e.target));
      if (!el || (el !== e.target)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && !el.dataset.eptChoix) { e.preventDefault(); effacer(el); }
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const av = selection ? selection.el : null;
        if (av !== el && second(av, el)) { deselectionner(); return; }
        basculer(el);
      }
    });

    // ── grandeurs en italique, éléments accessibles au clavier ──
    // une lettre seule est une grandeur (italique) ; un mot (pH, sin, ln) et
    // Δ restent droits, comme les nombres et les indices ; un libellé dans
    // <span class="eq-droit"> reste droit (espèce chimique : [H₃O⁺])
    const LETTRES = /Δ|\p{L}+/gu;
    function italiques(el) {
      if (el.dataset.eptI) return;
      el.dataset.eptI = '1';
      const marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.parentElement.closest('sub, .tile-del, .ept-croix, .dots, .ept-i, .eq-droit') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      const noeuds = [];
      while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
      noeuds.forEach(n => {
        const s = n.nodeValue;
        LETTRES.lastIndex = 0;
        if (![...s.matchAll(LETTRES)].some(m => m[0].length === 1 && m[0] !== 'Δ' && m[0] !== 'π')) return;
        const frag = document.createDocumentFragment();
        let i = 0;
        for (const m of s.matchAll(LETTRES)) {
          if (m[0].length !== 1 || m[0] === 'Δ' || m[0] === 'π') continue;
          if (m.index > i) frag.appendChild(document.createTextNode(s.slice(i, m.index)));
          const it = document.createElement('i');
          it.className = 'ept-i';
          it.textContent = m[0];
          frag.appendChild(it);
          i = m.index + 1;
        }
        if (i < s.length) frag.appendChild(document.createTextNode(s.slice(i)));
        n.parentNode.replaceChild(frag, n);
      });
    }
    const TUILES = '.eq-tile, .eq-tile-frozen, .eq-tile-locked, .eq-tile-static, .palette-tile';
    function preparer(racine) {
      if (!racine.querySelectorAll) return;
      const liste = [...racine.querySelectorAll(TUILES)];
      if (racine.matches && racine.matches(TUILES)) liste.push(racine);
      liste.forEach(el => {
        italiques(el);
        if ((el.classList.contains('eq-tile') || el.classList.contains('eq-tile-locked')) && !el.hasAttribute('tabindex') && (tuileEffacable(el) || tuileChoix(el))) el.tabIndex = 0;
      });
      const cases = [...racine.querySelectorAll('.slot-simple')];
      if (racine.matches && racine.matches('.slot-simple')) cases.push(racine);
      cases.forEach(c => {
        if (caseVide(c) && !c.hasAttribute('tabindex')) {
          c.tabIndex = 0;
          c.setAttribute('aria-label', estDen(c) ? 'Dénominateur vide' : 'Case vide');
        }
      });
    }
    function demarrer() {
      preparer(document.body);
      new MutationObserver(liste => liste.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && !n.classList.contains('drag-ghost')) preparer(n.parentElement || n);
      }))).observe(document.body, { childList: true, subtree: true });
    }
    if (document.body) demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);

    // ── historique d'un éditeur (bouton « ↶ Annuler ») ──
    function historique(boutons) {
      let pile = [], dernier = null, groupeNote = -1;
      const maj = () => (boutons() || []).forEach(b => { if (b) b.disabled = !pile.length; });
      return {
        noter(etat) {
          const s = JSON.stringify(etat);
          if (dernier !== null && s !== dernier && !(enGroupe && groupeNote === groupe)) {
            pile.push(dernier);
            if (pile.length > 100) pile.shift();
            if (enGroupe) groupeNote = groupe;
          }
          dernier = s;
          maj();
        },
        vider() { pile = []; dernier = null; maj(); },
        annuler() {
          if (!pile.length) return null;
          dernier = pile.pop();
          maj();
          return JSON.parse(dernier);
        },
      };
    }

    // ── élément qui ne se déplace pas (dans une fonction, dans une parenthèse) ──
    function bloquer(el, message, afficher) {
      el.dataset.eptBloque = '1';
      el.style.touchAction = 'none';
      el._eptBloque = () => afficher(message);
    }
    const MSG_FONCTION = "✕ On ne peut pas déplacer un terme qui est dans une fonction : supprime d'abord la fonction en appliquant sa fonction réciproque aux deux membres.";
    const MSG_PAREN = "✕ On ne peut pas déplacer un terme qui est dans une parenthèse : la parenthèse forme un seul bloc.";

    // un éditeur s'abonne : { paire(a, b), choix(el) }
    const ecouter = f => ecouteurs.push(f);
    return { appui: () => {}, historique, bloquer, ecouter, deselectionner, MSG_FONCTION, MSG_PAREN };  })();

  /* ---------- racine carrée : crochet à la hauteur du contenu (equations.css) ---------- */
  const CROCHET = '<line x1="0" y1=".42em" x2="40%" y2="0"/><line x1="40%" y1="0" x2="100%" y2="100%"/>';
  function crochets(racine) {
    racine.querySelectorAll('svg.sqrt-hook').forEach(s => { if (!s.firstChild) s.innerHTML = CROCHET; });
  }

  /* ---------- messages par défaut (EQ.MESSAGES), remplaçables par exercice.messages ---------- */
  const MESSAGES = {
    MSG_DEDANS: "Sous la racine, une grandeur ne se déplace pas : on peut seulement la simplifier avec la même grandeur placée de l'autre côté du trait de fraction (touche-la, puis touche l'autre).",
    MSG_SIMPL: "On ne simplifie qu'une grandeur du numérateur avec la même grandeur au dénominateur d'une même fraction.",
    MSG_BARRES: "Des termes sont barrés : touche d'abord « ✓ Vérifier l'étape », ils s'effaceront. Tu pourras ensuite continuer.",
    MSG_BARRE: "Ce terme est simplifié : il s'effacera quand tu toucheras « ✓ Vérifier l'étape ».",
    BULLE_CHOIX: "<b>Simplifier</b> : touche maintenant {g} de l'autre côté du trait de fraction. Les deux se barrent.",
    BULLE_BARRE: "Chaque paire barrée a sa couleur : simplifie d'autres paires si tu veux, puis touche « ✓ Vérifier l'étape » pour effacer les termes barrés.",
    MSG_ENTRER: "Seul un facteur qui multiplie la racine (dans le même membre) peut entrer sous la racine ; il y entre au carré.",
    MSG_SUBST: "Dépose cet outil sur la grandeur {g} de l'équation, pour la remplacer.",
    MSG_MOVE: REGLES.MSG_MOVE, MSG_MOVE_FRAC: REGLES.MSG_MOVE_FRAC, MSG_INSERT: REGLES.MSG_INSERT,
    MSG_SUMTERM: REGLES.MSG_SUMTERM, MSG_FRAC: REGLES.MSG_FRAC, MSG_FRACDEN: REGLES.MSG_FRACDEN,
    MSG_FONCTION: EPT.MSG_FONCTION, MSG_PAREN: EPT.MSG_PAREN,
    VIDE: "Complète les deux membres de l'équation avant de vérifier : une case vide au numérateur s'écrit 1.",
    INCHANGE: "L'équation n'a pas changé : déplace d'abord un élément ou utilise un outil.",
    FAUX: "<b>Ce n'est pas ça.</b> Cette équation n'est plus égale à celle de départ : annule la dernière action (↶) et vérifie la règle utilisée.",
    RECIPROQUE: "✕ Impossible : pour rester simple, une fonction réciproque ne s'utilise que sur la fonction seule, sans rien d'autre autour (pas de signe −, pas de multiplication ni de division). Isole d'abord la fonction.",
  };

  /* ============================================================
     3. MOTEUR D'UN ÉDITEUR (editeur.js de l'application mobile)
     Chaque appel crée un éditeur indépendant : son équation, son historique,
     sa réserve, ses messages. Les fonctions d'écriture figée (statique, ligne)
     ne dépendent d'aucun état.
     ============================================================ */
  function Moteur() {
    // message de l'exercice en cours, sinon message par défaut
    const msg = k => (currentExercise && currentExercise.messages && currentExercise.messages[k]) || MESSAGES[k];

    function tile(id,label){ return {id,label}; }
    function simple(items){ return { kind:'simple', items: items.map(t => ({...t})) }; }
    function frac(num, den){ return { kind:'frac', num: Array.isArray(num) ? simple(num) : num, den: Array.isArray(den) ? simple(den) : den }; }
    function seq(slots){ return { kind:'seq', slots }; }
    function emptySeq(){ return seq([simple([])]); }
    function term1(sign, slots){ return { sign, node: seq(slots) }; }
    function sumNode(terms){ return { kind:'sum', terms: terms.map(t => ({ sign:t.sign, node:t.node })) }; }
    function func(fn, inner, n){ const f = { kind:'func', fn, inner }; if (n) f.n = n; return f; }
    function idsOf(items){ return items.map(i => i.id); }

    // fonctions et leur réciproque (les puissances sont traitées à part : voir annule)
    const RECIPROCAL = { sin:'asin', asin:'sin', cos:'acos', acos:'cos', tan:'atan', atan:'tan', log:'pow10', pow10:'log', ln:'exp', exp:'ln' };
    // exposant d'une fonction puissance (carré, racine, cube, racine cubique, puissance n, puissance 1/n)
    function exposant(fn, n) {
        return { sq: 2, sqrt: 1 / 2, cube: 3, cbrt: 1 / 3 }[fn] || (fn === 'pow' ? n : fn === 'proot' ? 1 / n : null);
    }
    // un outil « fn:n » (ex. 'pow:4', 'proot:4') : { fn, n }
    function outil(t) { const p = String(t).split(':'); return { fn: p[0], n: p[1] ? +p[1] : undefined }; }
    // l'outil annule-t-il cette fonction ? (même opération réciproque, ou exposants inverses : (x⁴)^(1/4) = x)
    function annule(o, f) {
        if (!f || f.kind !== 'func') return false;
        if (RECIPROCAL[o.fn]) return RECIPROCAL[o.fn] === f.fn;
        const a = exposant(o.fn, o.n), b = exposant(f.fn, f.n);
        return a != null && b != null && Math.abs(a * b - 1) < 1e-9;
    }
    const EXP = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
    function libelleOutil(t) {
        const o = outil(t);
        if (o.fn === 'pow') return 'x' + (EXP[o.n] || '<sup>' + o.n + '</sup>');
        if (o.fn === 'proot') return 'x<sup>1/' + o.n + '</sup>';
        return { sqrt:'√', sq:'x²', cube:'x³', cbrt:'∛', sin:'sin', asin:'Arcsin', cos:'cos', acos:'Arccos', tan:'tan', atan:'Arctan',
            log:'log', pow10:'10ˣ', ln:'ln', exp:'eˣ', inv:'1/x' }[o.fn];
    }
    // dans la réserve, sous l'outil : la fonction qu'il annule (sauf carré et racine carrée, bien connus)
    function noteOutil(t) {
        const o = outil(t);
        if (o.fn === 'pow') return 'réciproque de x<sup>1/' + o.n + '</sup>';
        if (o.fn === 'proot') return 'réciproque de x' + (EXP[o.n] || '<sup>' + o.n + '</sup>');
        return { cube:'réciproque de ∛', cbrt:'réciproque de x³', sin:'réciproque de Arcsin', asin:'réciproque de sin',
            cos:'réciproque de Arccos', acos:'réciproque de cos', tan:'réciproque de Arctan', atan:'réciproque de tan',
            log:'réciproque de 10ˣ', pow10:'réciproque de log', ln:'réciproque de eˣ', exp:'réciproque de ln', inv:'inverse les deux membres' }[o.fn] || '';
    }
    // nom écrit devant les parenthèses d'une fonction
    const FUNC_NAME = { log:'log', ln:'ln', sin:'sin', asin:'Arcsin', cos:'cos', acos:'Arccos', tan:'tan', atan:'Arctan' };
    // message affiché quand on essaie de déplacer un terme qui ne peut pas bouger (tuiles.js)
    const afficherRefus = msg => { hadError = true; erreur(); showFeedback(msg, false); };
    // rappels de la page (séance, découverte)
    let rappels = {};
    const erreur = () => { if (rappels.surErreur) rappels.surErreur(); };
    // racine de l'éditeur affiché, et ses parties
    let racine = null;
    const part = cls => racine ? racine.querySelector('.' + cls) : null;

    // libellé d'une tuile : la grandeur, avec sa puissance (v², T⁴) ; pow : exposant entier ≥ 2
    // simplification en attente (it.sim : [{ reste, c }], une entrée par paire barrée, c : couleur de la paire) :
    // grandeur entièrement simplifiée (reste 0) → barrée en entier ; sinon sa puissance est barrée
    // et la nouvelle est écrite au-dessus (rien si elle vaut 1)
    const puiss = n => EXP[n] || '<sup>' + n + '</sup>';
    function lab(it) {
        const b = it.sim;
        if (!b || !b.length) return it.label + (it.pow > 1 ? puiss(it.pow) : '');
        const der = b[b.length - 1];
        if (!der.reste) {
            const avant = { label: it.label, pow: b.length > 1 ? b[b.length - 2].reste : it.pow, sim: b.slice(0, -1) };
            return `<span class="eq-barre" style="--c:${coulPaire(der.c)}">${lab(avant)}</span>`;
        }
        // puissances successives : la première, puis le reste de chaque paire ; la dernière n'est pas barrée
        const pows = [it.pow || 1].concat(b.map(e => e.reste));
        let pile = der.reste > 1 ? `<span class="eq-pw-nv" style="--c:${coulPaire(der.c)}">${der.reste}</span>` : '';
        // barre dans l'autre sens sur 2, 4, 6, 7, 9 : leur trait penché se confondrait avec elle (fractions-college)
        const inv = n => /[24679]/.test(String(n)) ? ' eq-barre-inv' : '';
        for (let i = b.length - 1; i >= 0; i--) if (pows[i] > 1) pile += `<span class="eq-barre eq-barre-fin${inv(pows[i])}" style="--c:${coulPaire(b[i].c)}">${pows[i]}</span>`;
        return it.label + `<span class="eq-pw">${pile}</span>`;
    }
    // couleur d'une paire de termes simplifiés (mêmes couleurs que fractions-college)
    const COUL_PAIRES = ['--orga-ram-1', '--orga-ram-3', '--orga-ram-4', '--orga-ram-2', '--orga-groupe', '--orga-chaine'];
    const coulPaire = c => 'var(' + COUL_PAIRES[c % COUL_PAIRES.length] + ')';
    // puissance d'une tuile une fois ses simplifications appliquées (0 : elle disparaît)
    const puissEff = it => (it.sim && it.sim.length ? it.sim[it.sim.length - 1].reste : (it.pow || 1));
    function staticFracHtml(num, den) {
        return `<span class="frac-wrap-static"><span class="frac-num-static">${num}</span><span class="frac-line-static"></span><span class="frac-den-static">${den}</span></span>`;
    }

    // ═══════════════════════════════════════════════════════════════
    // ÉTAT GLOBAL
    // ═══════════════════════════════════════════════════════════════
    let state = { left: emptySeq(), right: emptySeq() };
    // « ↶ Annuler » : revient à l'équation d'avant la dernière action (../tuiles.js)
    const annul = EPT.historique(() => racine ? racine.querySelectorAll('.ep-annuler') : []);
    function annulerAction() {
        if (resolved) return;
        const prec = annul.annuler();
        if (prec) { state = prec; refreshView(); }
    }
    let history = [];
    let resolved = false;
    let stepOneValidated = false;
    let currentExercise = null;
    let hadError = false;
    let activeHighlightId = null;
    let signsToFlash = [];

    function getNode(path) {
        const parts = path.split('.');
        let cur = parts[0] === 'left' ? state.left : state.right;
        for (let i = 1; i < parts.length; i++) {
            if (!cur) return null;
            const p = parts[i];
            if (/^term\d+$/.test(p)) cur = cur.terms[+p.slice(4)].node;
            else if (/^\d+$/.test(p)) cur = cur.slots ? cur.slots[+p] : undefined;
            else cur = cur[p];
        }
        return cur || null;
    }
    function setNode(path, newNode) {
        const parts = path.split('.');
        if (parts.length === 1) { state[parts[0]] = newNode; return; }
        const parent = getNode(parts.slice(0, -1).join('.'));
        const last = parts[parts.length - 1];
        if (/^term\d+$/.test(last)) parent.terms[+last.slice(4)].node = newNode;
        else if (/^\d+$/.test(last)) parent.slots[+last] = newNode;
        else parent[last] = newNode;
    }

    // ═══════════════════════════════════════════════════════════════
    // AFFICHAGE
    // ═══════════════════════════════════════════════════════════════
    function isOperatorTile(it) { return it.id === 'plus' || it.id === 'minus' || it.id === 'times'; }
    function wrapParens(innerHtml) {
        return `<span class="paren-wrap"><span class="paren-bracket paren-open">(</span><span class="paren-content">${innerHtml}</span><span class="paren-bracket paren-close">)</span></span>`;
    }
    function sizeParens(container) {
        container.querySelectorAll('.paren-wrap').forEach(wrap => {
            const content = wrap.querySelector('.paren-content');
            if (!content) return;
            const h = content.offsetHeight || 24;
            const scale = Math.max(1, h / 22);
            wrap.querySelectorAll('.paren-bracket').forEach(b => { b.style.transform = `scaleY(${scale.toFixed(2)})`; });
        });
    }
    function renderInsertZone(sidePath, where) {
        return `<div class="insert-zone" data-side="${sidePath}" data-where="${where}"></div>`;
    }
    function isSumIsolated(sumPath) {
        const parentPath = sumPath.split('.').slice(0, -1).join('.');
        const parent = getNode(parentPath);
        if (!parent || parent.kind !== 'seq' || parent.slots.length !== 1) return false;
        if (parent.parenthesized) return false;
        return true;
    }
    function denHasRealContent(node) {
        if (isSlotEmpty(node.den)) return false;
        if (node.den.kind === 'simple' && node.den.items.length === 1 && node.den.items[0].id === 'one') return false;
        return true;
    }
    // contenu d'une fonction (racine, carré, log...) : toujours figé (une seule
    // entité, non démontable tant que la fonction n'est pas retirée) ; une
    // fraction s'y écrit en fraction (numérateur au-dessus du dénominateur), sauf
    // dans un exposant (enLigne) où elle reste en ligne (num/den) pour rester petite ;
    // une somme à plusieurs termes reçoit des parenthèses quand demandé
    // ouvert() : l'exercice permet d'agir dans une racine (entrer un facteur, simplifier, remplacer) ;
    // path : chemin du nœud, donné seulement dans l'éditeur actif d'un tel exercice
    const ouvert = () => !!(currentExercise && currentExercise.racineOuverte);
    const simplifiable = () => !!(currentExercise && currentExercise.simplifier);
    function renderInlineNode(node, staticMode, enLigne, path) {
        if (staticMode || !ouvert()) path = null;
        const sous = (n, suite) => renderInlineNode(n, staticMode, enLigne, path ? path + suite : null);
        if (node.kind === 'frac') {
            const num = sous(node.num, '.num'), den = sous(node.den, '.den');
            if (enLigne) return `<span class="inline-frac">${num}<span class="inline-frac-slash">/</span>${den}</span>`;
            if (staticMode) return staticFracHtml(num, den);
            return `<span class="frac-wrap frac-fonction"><span class="frac-num-wrap">${num}</span><span class="frac-line"></span><span class="frac-den-wrap">${den}</span></span>`;
        }
        if (node.kind === 'sum') {
            const inner = node.terms.map((t, i) => {
                const showSign = i > 0 || t.sign === -1;
                const signChar = t.sign === -1 ? '−' : '+';
                return (showSign ? `<span class="sum-sign">${signChar}</span>` : '') + sous(t.node, '.term' + i);
            }).join('');
            return `<span class="sum-wrap">${inner}</span>`;
        }
        if (node.kind === 'seq') {
            return node.slots.map((s, i) => (i === 0 ? '' : '<span class="mult-sign">×</span>') + sous(s, '.' + i)).join('');
        }
        if (node.kind === 'simple') {
            // dans l'editeur actif : meme apparence qu'une tuile normale (pas de
            // gris "desactive") meme si elle n'est pas manipulable tant que la
            // fonction englobante est la ; dans un texte statique (intro,
            // historique) : texte noir simple, sans encadre, comme le reste de
            // l'equation figee
            if (node.items.length === 0) return '<span class="slot-placeholder">…</span>';
            const tileClass = staticMode ? 'eq-tile-static' : 'eq-tile-locked';
            // exercice de simplification : une grandeur de la racine se choisit d'un appui (simplifier en deux appuis)
            const choix = it => path && simplifiable() && puissEff(it) > 0 ? ' data-ept-choix="1"' : '';
            return node.items.map((it, idx) => {
                const sep = (idx > 0 && !isOperatorTile(node.items[idx - 1]) && !isOperatorTile(it)) ? '<span class="mult-sign">×</span>' : '';
                return sep + `<span class="${tileClass}"${path ? ` data-path="${path}" data-idx="${idx}"` : ''}${choix(it)}>${lab(it)}</span>`;
            }).join('');
        }
        if (node.kind === 'func') return renderFunc(node, staticMode, enLigne, path);
        return renderStatic(node);
    }
    // une fonction et son contenu (racine, carré, cube, racine cubique, puissance de 10,
    // exponentielle, log, ln, sin, Arcsin) : les parenthèses d'une fonction nommée
    // prennent la hauteur de tout son contenu (sizeParens) ; l'exposant de 10 et de e
    // est écrit en haut, en petit
    function renderFunc(node, staticMode, enLigne, path) {
        const pIn = path && !staticMode && ouvert() ? path + '.inner' : null;
        const inner = (parens, ligne) => renderFuncInner(node.inner, parens, staticMode, ligne || enLigne, pIn);
        // exposant : parenthèses dès que le contenu n'est pas une seule grandeur
        const puiss = e => `<span class="func-wrap">${renderFuncInner(node.inner, 'tout', staticMode, enLigne)}<span class="func-exp">${e}</span></span>`;
        switch (node.fn) {
            case 'sqrt': return `<div class="sqrt-wrap"${pIn ? ` data-func-path="${path}"` : ''}><svg class="sqrt-hook"></svg><div class="sqrt-inner">${inner(false)}</div></div>`;
            case 'cbrt': return `<div class="sqrt-wrap"><span class="cbrt-index">3</span><svg class="sqrt-hook"></svg><div class="sqrt-inner">${inner(false)}</div></div>`;
            case 'sq':   return puiss('2');
            case 'cube': return puiss('3');
            case 'pow':  return puiss(String(node.n));
            case 'proot': return puiss('1/' + node.n);
            case 'pow10': return `<span class="func-wrap pow-wrap"><span class="pow-base">10</span><span class="func-exp-inner">${inner(true, true)}</span></span>`;
            case 'exp':   return `<span class="func-wrap pow-wrap"><span class="pow-base">e</span><span class="func-exp-inner">${inner(true, true)}</span></span>`;
        }
        return `<span class="func-wrap"><span class="func-name">${FUNC_NAME[node.fn]}</span>${wrapParens(inner(false))}</span>`;
    }
    function renderFuncInner(inner, parensIfSum, staticMode, enLigne, path) {
        let n = inner;
        while (n.kind === 'seq' && n.slots.length === 1) { n = n.slots[0]; if (path) path += '.0'; }
        const html = renderInlineNode(n, staticMode, enLigne, path);
        if (parensIfSum && n.kind === 'sum' && n.terms.length > 1) return wrapParens(html);
        // 'tout' (puissance) : parenthèses aussi autour d'une fraction ou d'un produit
        if (parensIfSum === 'tout' && (n.kind === 'frac' || n.kind === 'seq' || (n.kind === 'simple' && n.items.length > 1))) return wrapParens(html);
        return html;
    }
    function renderNode(node, path) {
        if (node.kind === 'simple') {
            const items = node.items.map((it, idx) => {
                const hl = (activeHighlightId && it.id === activeHighlightId) ? ' tile-highlight' : '';
                const sep = (idx > 0 && !isOperatorTile(node.items[idx-1]) && !isOperatorTile(it)) ? '<span class="mult-sign">×</span>' : '';
                // simplification en attente : la tuile se choisit seulement (pas de croix, pas de glisser)
                const choix = it.sim && puissEff(it) > 0 ? ' data-ept-choix="1"' : '';
                return sep + `<span class="eq-tile${hl}" data-path="${path}" data-idx="${idx}"${choix}>
                    ${lab(it)}<span class="tile-del" data-eq-sup="${path}|${idx}">✕</span>
                </span>`;
            }).join('');
            // case vide qu'on peut supprimer (facteur vide d'un produit, terme vide
            // d'une somme) : une commande d'effacement, sélectionnée par un appui (tuiles.js)
            const croixCase = !node.items.length && emptySlotOwner(path)
                ? `<span class="frac-del" data-eq-case="${path}" title="Supprimer la case vide">✕</span>` : '';
            return `<div class="slot-simple" data-path="${path}">
                        ${items || '<span class="slot-placeholder">…</span>'}${croixCase}
                    </div>`;
        }
        if (node.kind === 'frac') {
            // dénominateur réduit à 1, ou dénominateur vide (même sans forceDenCross,
            // ex. après l'outil 1/x sur un numérateur vide) : on peut le supprimer
            const showDenCross = (node.den.kind === 'simple' && node.den.items.length === 1 && node.den.items[0].id === 'one')
                || (isSlotEmpty(node.den) && (node.forceDenCross || node.den.kind === 'simple'));
            const draggableDen = denHasRealContent(node);
            return `<div class="frac-wrap">
                <div class="frac-num-wrap">${renderNode(node.num, path + '.num')}</div>
                <div class="frac-line"></div>
                <div class="frac-den-wrap${draggableDen ? ' den-draggable' : ''}" data-frac-path="${path}">
                    ${showDenCross ? `<span class="frac-del" data-eq-den="${path}" title="Supprimer le dénominateur">✕</span>` : ''}
                    ${renderNode(node.den, path + '.den')}
                </div>
            </div>`;
        }
        if (node.kind === 'sum') {
            // aucun terme restant (tous deplaces de l'autre cote) : on l'affiche
            // explicitement au lieu de laisser un vide
            if (node.terms.length === 0) {
                return `<span class="sum-wrap sum-zero" data-path="${path}">0</span>`;
            }
            // un seul terme : ce n'est plus une somme a proprement parler mais un
            // simple signe devant un contenu multiplicatif ; chaque facteur a
            // l'interieur doit rester individuellement manipulable (ex. -λ×t), donc
            // pas de bloc .sum-term qui bloquerait le glisser-deposer des tuiles.
            // Seul le signe (s'il est negatif) reste saisissable pour deplacer le
            // terme entier de l'autre cote.
            if (node.terms.length === 1) {
                const t = node.terms[0];
                const signHtml = t.sign === -1
                    ? `<span class="sum-sign sum-sign-drag" data-sum-path="${path}" data-term-idx="0">−</span>`
                    : '';
                // si le terme se reduit a une seule grandeur (pas un produit de
                // plusieurs facteurs), la glisser doit deplacer le terme additif
                // (signe inverse), pas l'extraire comme un facteur multiplicatif
                let flat = t.node;
                while (flat.kind === 'seq' && flat.slots.length === 1) flat = flat.slots[0];
                const singleTile = flat.kind === 'simple' && flat.items.length === 1;
                return `<span class="sum-wrap${singleTile ? ' sum-term-single' : ''}" data-path="${path}" data-term-idx="0">${signHtml}${renderNode(t.node, path + '.term0')}</span>`;
            }
            const isolated = isSumIsolated(path);
            const inner = node.terms.map((t, i) => {
                const showSign = i > 0 || t.sign === -1;
                const signChar = t.sign === -1 ? '−' : '+';
                const signHtml = showSign ? `<span class="sum-sign" data-sum-path="${path}" data-term-idx="${i}">${signChar}</span>` : '';
                return `<span class="sum-term${isolated ? ' term-draggable' : ''}" data-path="${path}" data-term-idx="${i}">${signHtml}${renderNode(t.node, path + '.term' + i)}</span>`;
            }).join('');
            return `<span class="sum-wrap" data-path="${path}">${inner}</span>`;
        }
        if (node.kind === 'func') {
            // fonction qui multiplie d'autres facteurs (e^(λt) × N, (T/2π)² × g) : elle se déplace en bloc
            const par = path.split('.').slice(0, -1).join('.'), p = par && getNode(par);
            if (p && p.kind === 'seq' && p.slots.length > 1) return `<span class="func-bloc" data-bloc-path="${path}">${renderFunc(node, false, false, path)}</span>`;
            return renderFunc(node, false, false, path);
        }
        // seq
        let html = '';
        const n = node.slots.length;
        // zones de dépôt à côté d'une fraction, d'une somme ou d'une fonction (pour y ajouter un facteur)
        const avecZone = k => k === 'frac' || k === 'sum' || k === 'func';
        const needsInsertBefore = avecZone(node.slots[0].kind);
        const needsInsertAfter  = avecZone(node.slots[n-1].kind);
        if (needsInsertBefore) html += renderInsertZone(path, 'start');
        let inner = '';
        node.slots.forEach((slot, i) => {
            if (i > 0) inner += '<span class="mult-sign">×</span>';
            const parens = !node.parenthesized && slot.kind === 'sum' && slot.terms.length > 1 && n > 1;
            inner += parens ? wrapParens(renderNode(slot, path + '.' + i)) : renderNode(slot, path + '.' + i);
        });
        html += node.parenthesized ? wrapParens(inner) : inner;
        if (needsInsertAfter) html += renderInsertZone(path, 'end');
        return `<div class="eq-side" data-path="${path}">${html}</div>`;
    }
    function renderStatic(node) {
        if (node.kind === 'simple') {
            if (node.items.length === 0) return '<span class="slot-placeholder">…</span>';
            return node.items.map((it, idx) => {
                const sep = (idx > 0 && !isOperatorTile(node.items[idx-1]) && !isOperatorTile(it)) ? '<span class="mult-sign">×</span>' : '';
                return sep + `<span class="eq-tile-static">${lab(it)}</span>`;
            }).join('');
        }
        if (node.kind === 'frac') {
            return `<div class="frac-wrap">
                <div class="frac-num-wrap">${renderStatic(node.num)}</div>
                <div class="frac-line"></div>
                <div class="frac-den-wrap">${renderStatic(node.den)}</div>
            </div>`;
        }
        if (node.kind === 'sum') {
            if (node.terms.length === 0) return `<span class="sum-wrap sum-zero">0</span>`;
            const inner = node.terms.map((t, i) => {
                const showSign = i > 0 || t.sign === -1;
                const signChar = t.sign === -1 ? '−' : '+';
                return (showSign ? `<span class="sum-sign">${signChar}</span>` : '') + renderStatic(t.node);
            }).join('');
            return `<span class="sum-wrap">${inner}</span>`;
        }
        if (node.kind === 'func') return renderFunc(node, true);
        return `<div class="eq-side">${node.slots.map((s,i) => (i===0?'':'<span class="mult-sign">×</span>') + renderStatic(s)).join('')}</div>`;
    }
    function renderEquationZone() {
        const zone = part('ed-zone');
        if (!zone) return;
        zone.innerHTML =
            renderNode(state.left, 'left') +
            `<div class="eq-sign">=</div>` +
            renderNode(state.right, 'right') +
            `<button type="button" class="flip-btn" data-eq-inv="1" title="Inverser le sens de l'équation" aria-label="Inverser le sens de l'équation">⇄</button>`;
        attachEqTileHandlers(zone);
        sizeSqrtHooks(zone);
        sizeParens(zone);
        if (signsToFlash.length) {
            signsToFlash.forEach(({ sidePath, termIdx }) => {
                const el = zone.querySelector(`.sum-sign[data-sum-path="${sidePath}"][data-term-idx="${termIdx}"]`);
                if (el) { el.classList.add('just-flipped'); setTimeout(() => el.classList.remove('just-flipped'), 1300); }
                let termEl = zone.querySelector(`.sum-term[data-path="${sidePath}"][data-term-idx="${termIdx}"]`);
                if (!termEl && termIdx === 0) termEl = zone.querySelector(`.sum-wrap[data-path="${sidePath}"]`);
                if (!termEl) {
                    // la structure a change (ex. simplification automatique une fois
                    // le signe redevenu positif) : impossible de cibler precisement
                    // le terme, on fait clignoter tout le membre pour que le
                    // changement de signe reste toujours visible
                    termEl = zone.querySelector(`.eq-side[data-path="${sidePath.split('.')[0]}"]`);
                }
                if (termEl) { termEl.classList.add('term-flash'); setTimeout(() => termEl.classList.remove('term-flash'), 1300); }
            });
            signsToFlash = [];
        }
    }
    function sizeSqrtHooks(container) {
        // crochet commun (../fiches.js) : sa hauteur suit celle du contenu (../fiches.css), même affiché plus tard
        crochets(container);
    }
    function attachEqTileHandlers(zone) {
        // terme dans une fonction : on peut l'attraper, mais il ne bouge pas (message tout de suite),
        // sauf s'il fait partie d'un bloc qui, lui, se déplace (dénominateur, terme additif)
        zone.querySelectorAll('.eq-tile-locked').forEach(el => {
            // racine ouverte (exercice de simplification) : la tuile ne se déplace pas, elle se choisit
            // d'un appui puis se simplifie avec la même grandeur touchée de l'autre côté du trait
            if (el.dataset.path) {
                const n = getNode(el.dataset.path), it = n && n.items && n.items[+el.dataset.idx];
                if (it) { EPT.bloquer(el, it.sim ? msg('MSG_BARRE') : msg('MSG_DEDANS'), it.sim ? m => showFeedback(m, null) : afficherRefus); return; }
            }
            if (!el.closest('.den-draggable, .term-draggable, .sum-term-single, .func-bloc')) EPT.bloquer(el, msg('MSG_FONCTION'), afficherRefus);
        });
        zone.querySelectorAll('.func-bloc').forEach(el => {
            if (ouvert()) return;     // racine ouverte : on agit sur ses tuiles, pas sur le bloc entier
            if (el.closest('.den-draggable, .term-draggable, .sum-term-single')) return;
            enableTileDrag(el, { type:'bloc', from: el.dataset.blocPath });
        });
        zone.querySelectorAll('.eq-tile').forEach(el => {
            // simplification en attente : la tuile ne se déplace plus avant la vérification de l'étape
            const zt = getNode(el.dataset.path), tt = zt && zt.items && zt.items[+el.dataset.idx];
            if (tt && tt.sim) { EPT.bloquer(el, msg('MSG_BARRE'), m => showFeedback(m, null)); return; }
            // terme dans une parenthèse : même chose
            if (el.closest('.paren-wrap') && !el.closest('.den-draggable, .term-draggable')) { EPT.bloquer(el, msg('MSG_PAREN'), afficherRefus); return; }
            // une tuile a l'interieur d'un terme additif d'une somme a plusieurs
            // termes (.sum-term, isolee ou non) ne doit jamais etre glissable
            // individuellement : ce genre de terme ne se deplace qu'en bloc (via
            // .sum-term.term-draggable une fois isole), jamais facteur par facteur
            if (el.closest('.sum-term')) return;
            if (el.closest('.frac-den-wrap.den-draggable')) return;
            // une somme reduite a un seul terme qui n'est lui-meme qu'une seule
            // grandeur (pas un produit de plusieurs facteurs) : la glisser doit
            // deplacer le terme additif entier (signe inverse), exactement comme
            // la poignee de signe, et non l'extraire comme un simple facteur
            const singleTermWrap = el.closest('.sum-wrap.sum-term-single');
            if (singleTermWrap) {
                const sumPath = singleTermWrap.dataset.path;
                const termIdx = parseInt(singleTermWrap.dataset.termIdx, 10);
                const sum = getNode(sumPath);
                const t = sum && sum.terms[termIdx];
                if (!t) return;
                enableTileDrag(el, { type:'sumterm', from:sumPath, termIdx, sign:t.sign });
                return;
            }
            const path = el.dataset.path;
            const idx = parseInt(el.dataset.idx, 10);
            const node = getNode(path);
            const it = node && node.items[idx];
            if (!it) return;
            enableTileDrag(el, { type:'move', from:path, idx, id:it.id, label:lab(it), item:Object.assign({}, it) }, EPT.appui);
        });
        zone.querySelectorAll('.sum-term.term-draggable').forEach(el => {
            const sumPath = el.dataset.path;
            const termIdx = parseInt(el.dataset.termIdx, 10);
            const sum = getNode(sumPath);
            const t = sum && sum.terms[termIdx];
            if (!t) return;
            enableTileDrag(el, { type:'sumterm', from:sumPath, termIdx, sign:t.sign });
        });
        // signe d'une somme reduite a un seul terme negatif : sert de poignee pour
        // deplacer tout le terme (tous ses facteurs) de l'autre cote, sans bloquer
        // le glisser-deposer individuel des facteurs eux-memes (cf. ci-dessus)
        zone.querySelectorAll('.sum-sign-drag').forEach(el => {
            const sumPath = el.dataset.sumPath;
            const termIdx = parseInt(el.dataset.termIdx, 10);
            const sum = getNode(sumPath);
            const t = sum && sum.terms[termIdx];
            if (!t) return;
            enableTileDrag(el, { type:'sumterm', from:sumPath, termIdx, sign:t.sign });
        });
        zone.querySelectorAll('.frac-den-wrap.den-draggable').forEach(el => {
            const fracPath = el.dataset.fracPath;
            enableTileDrag(el, { type:'fracden', from:fracPath });
        });
    }
    // étapes validées : l'équation de départ, puis chaque étape juste, alignées sur le signe =
    function renderHistory() {
        const el = part('ed-hist');
        if (!el) return;
        el.innerHTML = history.map((st, i) => `
            <div class="step-row ed-ligne${i ? '' : ' ed-ligne0'}">
                <span class="ed-g">${renderStatic(st.left)}</span><span class="eq-sign">=</span><span class="ed-d">${renderStatic(st.right)}</span>
                ${i ? '<span class="ed-coche" aria-label="étape juste">✓</span>' : '<span></span>'}
            </div>`).join('');
        sizeSqrtHooks(el);
        sizeParens(el);
    }
    function updateHint() {}
    function refreshView() {
        annul.noter(state);
        renderEquationZone();
        buildPalette();
    }
    // message sous l'éditeur : juste (vert), faux ou refusé (rouge), vide
    function showFeedback(msg, ok) {
        const f = part('ed-retour');
        if (!f) return;
        msg = String(msg || '').replace(/^[✕✓]\s*/, '');
        if (!msg) { f.innerHTML = ''; return; }
        f.innerHTML = '<div class="' + (ok === null ? 'callout' : ok ? 'callout callout-success' : 'callout callout-danger') + '">' + (ok ? '✓ ' : '') + msg + '</div>';
        if (rappels.surMessage) rappels.surMessage(f);
    }

    // ═══════════════════════════════════════════════════════════════
    // GLISSER-DÉPOSER
    // ═══════════════════════════════════════════════════════════════
    function pruneEmptySlot(path) {
        const parts = path.split('.');
        if (parts.length !== 2) return;
        const side = getNode(parts[0]);
        const idx = +parts[1];
        const slot = side.slots[idx];
        if (slot && slot.kind === 'simple' && slot.items.length === 0 && side.slots.length > 1) {
            side.slots.splice(idx, 1);
        }
    }
    function applyEmptinessRuleFrac(path, removedId) {
        if (path.endsWith('.num')) return;
        if (path.endsWith('.den')) {
            const fracPath = path.slice(0, -4);
            const fracNode = getNode(fracPath);
            if (removedId === 'one') setNode(fracPath, fracNode.num);
            else fracNode.forceDenCross = true;
        }
    }
    function deleteDen(fracPath) {
        const fracNode = getNode(fracPath);
        if (!fracNode || fracNode.kind !== 'frac') return;
        if (!isSlotEmpty(fracNode.den) && !fracNode.forceDenCross) return;
        setNode(fracPath, fracNode.num);
        refreshView();
    }
    // case vide (…) qu'on peut supprimer : facteur vide d'un produit qui a d'autres
    // facteurs → { seq, idx } ; seule case d'un terme de somme → { sum, idx } (le terme
    // disparaît) ; sinon null (membre vide, numérateur vide : on y dépose une tuile)
    function emptySlotOwner(path) {
        const node = getNode(path);
        if (!node || node.kind !== 'simple' || node.items.length) return null;
        const parts = path.split('.');
        let last = parts.pop(), parentPath = parts.join('.');
        if (/^\d+$/.test(last) && parentPath) {
            const par = getNode(parentPath);
            if (!par || par.kind !== 'seq') return null;
            if (par.slots.length > 1) return { seq: parentPath, idx: +last };
            // seule case de son produit : on remonte au terme qui la contient
            const pp = parentPath.split('.');
            last = pp.pop(); parentPath = pp.join('.');
        }
        if (/^term\d+$/.test(last)) {
            const sum = getNode(parentPath);
            if (sum && sum.kind === 'sum') return { sum: parentPath, idx: +last.slice(4) };
        }
        return null;
    }
    function deleteEmptySlot(path) {
        const o = emptySlotOwner(path);
        if (!o) return;
        if (o.seq) getNode(o.seq).slots.splice(o.idx, 1);
        else removeSumTerm(o.sum, o.idx);
        refreshView();
    }
    function handleEmptied(path, removedId) {
        const parts = path.split('.');
        if (parts.length === 2) pruneEmptySlot(path);
        else applyEmptinessRuleFrac(path, removedId);
    }
    function processDrop(path, data) {
        if (data.type === 'frac') {
            if (!REGLES.isLegalFracTool(path)) { hadError = true; erreur(); showFeedback(msg('MSG_FRAC'), false); return; }
            const node = getNode(path);
            if (!node) return;
            if (node.kind === 'simple') {
                const f = frac(node.items, []);
                f.forceDenCross = true;
                setNode(path, f);
            } else if (node.kind === 'seq' && node.parenthesized) {
                const inner = node.slots.length === 1 ? node.slots[0] : seq(node.slots.slice());
                node.slots = [ { kind:'frac', num: inner, den: simple([]), forceDenCross:true } ];
                // la parenthese n'a servi qu'a figer temporairement le contenu en un
                // bloc unique pour pouvoir le mettre au numerateur : la barre de
                // fraction regroupe deja visuellement ce numerateur, un parenthesage
                // supplementaire autour de toute la fraction serait redondant
                node.parenthesized = false;
            } else if (node.kind === 'seq' && node.slots.length === 1 && node.slots[0].kind === 'func') {
                // une fonction (racine, log, sin...) est deja une entite autonome et
                // visuellement delimitee par ses propres parentheses : elle peut
                // directement devenir un numerateur, sans etape de parenthesage
                // prealable (contrairement a une somme, qui doit d'abord etre
                // explicitement parenthesee pour eviter toute ambiguite)
                node.slots = [ { kind:'frac', num: node.slots[0], den: simple([]), forceDenCross:true } ];
            } else {
                return;
            }
            refreshView();
            return;
        }
        const node = getNode(path);
        if (!node || node.kind !== 'simple') return;
        if (data.type === 'move') {
            if (!REGLES.isLegalMove(data.from, path)) { hadError = true; erreur(); showFeedback(msg('MSG_MOVE_FRAC'), false); return; }
            if (data.from === path) { refreshView(); return; }
            const src = getNode(data.from);
            if (src && src.items[data.idx] && src.items[data.idx].id === data.id) {
                const removedId = src.items[data.idx].id;
                src.items.splice(data.idx, 1);
                if (src.items.length === 0) handleEmptied(data.from, removedId);
            }
        }
        node.items.push(data.item ? Object.assign({}, data.item) : { id: data.id, label: data.label });
        refreshView();
    }
    function handleInsertDropAt(sidePath, where, data) {
        if (!data || data.type !== 'move') return;
        // même côté : un numérateur sort de sa fraction ; autre côté : un dénominateur passe en facteur
        // (les deux membres sont multipliés par ce terme)
        const memeCote = REGLES.side(data.from) === REGLES.side(sidePath);
        if (memeCote ? !REGLES.isLegalInsert(data.from, sidePath) : REGLES.level(data.from) !== 'den') {
            hadError = true; erreur(); showFeedback(memeCote ? msg('MSG_INSERT') : msg('MSG_MOVE_FRAC'), false); return;
        }
        const side = getNode(sidePath);
        if (!side || side.kind !== 'seq') return;
        const src = getNode(data.from);
        if (src && src.items[data.idx] && src.items[data.idx].id === data.id) {
            const removedId = src.items[data.idx].id;
            src.items.splice(data.idx, 1);
            if (src.items.length === 0) handleEmptied(data.from, removedId);
        }
        const newSlot = simple([data.item ? Object.assign({}, data.item) : { id: data.id, label: data.label }]);
        if (where === 'start') side.slots.unshift(newSlot); else side.slots.push(newSlot);
        refreshView();
    }
    function deleteItem(path, idx) {
        const node = getNode(path);
        if (!node || node.kind !== 'simple') return;
        const removed = node.items[idx];
        if (!removed) return;
        node.items.splice(idx, 1);
        if (node.items.length === 0) handleEmptied(path, removed.id);
        refreshView();
    }
    function enableTileDrag(el, data, onTap) {
        el._epmDonnees = data;                     // ce que l'élément déplace (tests automatiques)
        let startX = 0, startY = 0;
        el.addEventListener('pointerdown', e => { startX = e.clientX; startY = e.clientY; });
        DragDrop.enable(el, {
            racine: part('ed-zone') || racine,   // défilement automatique : la ligne de l'équation de cet éditeur
            zoneSelector: '.eq-tile, .eq-tile-locked[data-path], .sqrt-wrap[data-func-path], .slot-simple, .insert-zone, .eq-side, .sum-term',
            dragOverClass: 'drag-over',
            onStart: () => {
                if (data.type === 'sumterm' || data.type === 'fracden') {
                    racine.classList.add(data.type === 'sumterm' ? 'sumterm-dragging' : 'fracden-dragging');
                    const fromSide = data.from.split('.')[0];
                    const src = racine.querySelector(`.eq-side[data-path="${fromSide}"]`);
                    if (src) src.classList.add('sumterm-source');
                }
            },
            onDrop: (item, zone, evt) => {
                if (data.type === 'sumterm' || data.type === 'fracden') {
                    racine.classList.remove('sumterm-dragging');
                    racine.classList.remove('fracden-dragging');
                    racine.querySelectorAll('.eq-side.sumterm-source').forEach(e => e.classList.remove('sumterm-source'));
                }
                if (zone && !racine.contains(zone)) zone = null;
            const moved = Math.hypot(evt.clientX - startX, evt.clientY - startY) > 8;
                if (onTap && !moved) { onTap(); return; }
                // simple appui sur un dénominateur ou un terme entier : pas un déplacement
                // (le premier appui d'une simplification en deux temps, par exemple)
                if (!moved && (data.type === 'sumterm' || data.type === 'fracden')) return;
                if (zone) handleZoneDrop(data, zone);
            },
            onCancel: () => {
                if (data.type === 'sumterm' || data.type === 'fracden') {
                    racine.classList.remove('sumterm-dragging');
                    racine.classList.remove('fracden-dragging');
                    racine.querySelectorAll('.eq-side.sumterm-source').forEach(e => e.classList.remove('sumterm-source'));
                }
            },
        });
    }
    // le point exact ou l'on relache un outil peut tomber sur n'importe quel
    // descendant (une tuile precise, un terme d'une somme...) : pour les outils
    // qui agissent sur un membre ENTIER, on ne se fie pas au DOM (closest() peut
    // remonter vers un .eq-side interne, celui d'un terme ou d'un numerateur) mais
    // au chemin lui-meme, qui commence toujours par 'left' ou 'right'
    function resolveSidePath(zone) {
        const raw = zone.dataset.path || zone.dataset.side;
        return raw ? raw.split('.')[0] : null;
    }
    // pour l'outil fraction : si le point de depot tombe a l'interieur d'un
    // groupe explicitement parenthese, on remonte jusqu'a ce groupe (il doit etre
    // traite comme un bloc unique, jamais decompose au moment de le mettre au
    // numerateur)
    function resolveLockedAncestorPath(rawPath) {
        const parts = rawPath.split('.');
        for (let i = parts.length; i >= 1; i--) {
            const p = parts.slice(0, i).join('.');
            const n = getNode(p);
            if (n && n.kind === 'seq' && n.parenthesized) return p;
        }
        return rawPath;
    }
    function handleZoneDrop(data, zone) {
        // des termes barrés attendent la vérification : aucune autre transformation avant
        if (barresEnAttente()) { showFeedback(msg('MSG_BARRES'), null); return; }
        if (data.type === 'subst') { processSubst(data, zone.closest('[data-idx]')); return; }
        // un dénominateur entier glissé sur une racine ouverte : chacune de ses grandeurs y entre au carré
        if (data.type === 'fracden' && ouvert() && zone.closest('.sqrt-wrap[data-func-path]')) { processEntrerDen(data.from, zone.closest('.sqrt-wrap[data-func-path]').dataset.funcPath); return; }
        // racine ouverte : un facteur glissé sur la racine y entre au carré
        if (data.type === 'move' && ouvert()) {
            const r = zone.closest('.sqrt-wrap[data-func-path]');
            if (r) { processEntrer(data, r.dataset.funcPath); return; }
        }
        if (data.type === 'sumterm') {
            const side = resolveSidePath(zone);
            if (side === 'left' || side === 'right') processSumTermDrop(side, data);
            return;
        }
        if (data.type === 'fracden') {
            const side = resolveSidePath(zone);
            if (side === 'left' || side === 'right') processFracDenDrop(data.from, side);
            return;
        }
        if (data.type === 'bloc') {
            const side = resolveSidePath(zone);
            if (side === 'left' || side === 'right') processBlocDrop(data.from, side);
            return;
        }
        if (data.type === 'paren') {
            const side = resolveSidePath(zone);
            if (side === 'left' || side === 'right') processParenDrop(side);
            return;
        }
        if (zone.matches('.insert-zone')) {
            handleInsertDropAt(zone.dataset.side, zone.dataset.where, data);
            return;
        }
        if (data.type === 'frac') {
            processDrop(resolveLockedAncestorPath(zone.dataset.path), data);
            return;
        }
        processDrop(zone.dataset.path, data);
    }
    /* ---------- remplacer, simplifier, entrer sous la racine (exercices qui l'activent) ---------- */
    // fraction la plus proche d'un chemin de zone : { frac, niveau: 'num' | 'den' }, ou null
    function fracDe(path) {
        const p = path.split('.');
        for (let i = p.length - 1; i > 0; i--) {
            if (p[i] === 'num' || p[i] === 'den') return { frac: p.slice(0, i).join('.'), niveau: p[i] };
            if (p[i] === 'inner' || /^term\d+$/.test(p[i])) return null;
        }
        return null;
    }
    const zoneVide = n => n.kind === 'simple' && n.items.length === 0;
    const zoneUn = n => n.kind === 'simple' && n.items.length === 1 && n.items[0].id === 'one';
    const sansPow1 = t => { if (t.pow === 1 || !t.pow) delete t.pow; return t; };
    // zone simple où ajouter une tuile dans un nœud (lui-même, ou sa première zone simple)
    function zoneSimple(path) {
        const n = getNode(path);
        if (!n) return null;
        if (n.kind === 'simple') return path;
        if (n.kind === 'seq') { const k = n.slots.findIndex(x => x.kind === 'simple'); if (k >= 0) return path + '.' + k; }
        return null;
    }
    // ajoute une tuile à une zone : même grandeur déjà présente → les puissances s'ajoutent ; le 1 seul disparaît
    function ajouterTuile(zp, t) {
        const z = getNode(zp);
        if (zoneUn(z)) z.items = [];
        const m = z.items.find(x => x.id === t.id);
        if (m) { m.pow = (m.pow || 1) + (t.pow || 1); sansPow1(m); } else z.items.push(sansPow1(Object.assign({}, t)));
    }
    // un facteur d'un produit disparaît (case vidée) ; seul facteur : il devient 1
    function supprimerFacteur(path) {
        const p = path.split('.'), last = p.pop(), par = getNode(p.join('.'));
        if (par && par.kind === 'seq' && /^\d+$/.test(last) && par.slots.length > 1) par.slots.splice(+last, 1);
        else setNode(path, simple([tile('one', '1')]));
    }
    // une fraction après un retrait : dénominateur vide → plus de fraction ; numérateur vide → 1
    function nettoyerFrac(fp) {
        const f = getNode(fp);
        if (!f || f.kind !== 'frac') return;
        if (zoneVide(f.den) || zoneUn(f.den)) { if (zoneVide(f.num) || zoneUn(f.num)) supprimerFacteur(fp); else setNode(fp, f.num); }
        else if (zoneVide(f.num)) f.num = simple([tile('one', '1')]);
    }
    // une tuile quitte sa zone : la zone vide se range (fraction, facteur d'un produit)
    function retirerTuile(path, idx) {
        const z = getNode(path);
        z.items.splice(idx, 1);
        if (z.items.length) return;
        const fd = fracDe(path);
        if (fd && path === fd.frac + '.' + fd.niveau) nettoyerFrac(fd.frac);
        else supprimerFacteur(path);
    }
    /* ---------- simplifier en deux appuis (exercices avec simplifier: true) ----------
       Un appui choisit une grandeur (sélection, avec sa croix si elle peut être effacée) ; un appui
       sur la même grandeur de l'autre côté du trait de la même fraction barre les deux (une couleur
       par paire). Rien n'est retiré tout de suite : chaque tuile garde sa puissance (la valeur de
       l'équation ne change pas) et note la simplification dans it.sim ; « ✓ Vérifier l'étape »
       l'applique (appliquerBarres) : les termes barrés s'effacent, les puissances diminuent. */
    // toutes les tuiles de l'équation, avec leur chemin
    function tuilesEq() {
        const l = [];
        function voir(n, p) {
            if (!n) return;
            if (n.kind === 'simple') n.items.forEach((it, idx) => l.push({ path: p, idx, it }));
            else if (n.kind === 'seq') n.slots.forEach((x, i) => voir(x, p + '.' + i));
            else if (n.kind === 'frac') { voir(n.num, p + '.num'); voir(n.den, p + '.den'); }
            else if (n.kind === 'func') voir(n.inner, p + '.inner');
            else if (n.kind === 'sum') n.terms.forEach((t, i) => voir(t.node, p + '.term' + i));
        }
        voir(state.left, 'left');
        voir(state.right, 'right');
        return l;
    }
    const barresEnAttente = () => tuilesEq().some(t => t.it.sim);
    // simplifier un facteur commun aux deux membres (exercices avec simplifierMembres: true)
    const membresSimplifiables = () => !!(currentExercise && currentExercise.simplifierMembres);
    // une tuile multiplie-t-elle tout son membre ? { cote, bas } (bas : au dénominateur), sinon null
    // (pas dans une fonction, une somme ou une fraction de fraction, pas dans une zone avec + ou −)
    function facteurMembre(path) {
        const p = path.split('.');
        let nf = 0, bas = false;
        for (let i = 1; i < p.length; i++) {
            if (p[i] === 'num' || p[i] === 'den') { nf++; if (p[i] === 'den') bas = true; }
            else if (!/^\d+$/.test(p[i])) return null;
        }
        const z = getNode(path);
        if (nf > 1 || !z || z.kind !== 'simple' || z.items.some(isOperatorTile)) return null;
        return { cote: p[0], bas };
    }
    // A et B : même grandeur, chacune multipliant un membre, à la même place (en haut des deux côtés, ou en bas)
    function pairableMembres(pa, pb) {
        if (!membresSimplifiables()) return false;
        const ma = facteurMembre(pa), mb = facteurMembre(pb);
        return !!(ma && mb && ma.cote !== mb.cote && ma.bas === mb.bas);
    }
    // A (zone pa, rang ia) et B se simplifient-ils ? même grandeur, même fraction, de part et d'autre du trait
    // (ou, si l'exercice le permet, la même grandeur en facteur dans les deux membres)
    function pairable(pa, ia, pb, ib) {
        const fa = fracDe(pa), fb = fracDe(pb), za = getNode(pa), zb = getNode(pb);
        const A = za && za.items && za.items[ia], B = zb && zb.items && zb.items[ib];
        if (!(A && B && A !== B && A.id === B.id && puissEff(A) > 0 && puissEff(B) > 0)) return false;
        return !!(fa && fb && fa.frac === fb.frac && fa.niveau !== fb.niveau) || pairableMembres(pa, pb);
    }
    // existe-t-il, de l'autre côté du trait, la même grandeur pour simplifier ?
    const partenaire = (pa, ia) => tuilesEq().some(t => pairable(pa, ia, t.path, t.idx));
    function processSimplif(data, pathB, idxB) {
        if (!pairable(data.from, data.idx, pathB, idxB)) { afficherRefus(msg('MSG_SIMPL')); return false; }
        const A = getNode(data.from).items[data.idx], B = getNode(pathB).items[idxB];
        const pa = puissEff(A), pb = puissEff(B), k = Math.min(pa, pb);
        // couleur de la paire : la suivante après celles déjà barrées
        const c = tuilesEq().reduce((m, t) => Math.max(m, ...(t.it.sim || []).map(e => e.c + 1)), 0);
        (A.sim = A.sim || []).push({ reste: pa - k, c });
        (B.sim = B.sim || []).push({ reste: pb - k, c });
        const reste = pa - k || pb - k;
        const fA = fracDe(data.from), fB = fracDe(pathB);
        if (!(fA && fB && fA.frac === fB.frac)) {
            // facteur commun aux deux membres : on divise (ou on multiplie) les deux membres par ce facteur
            const bas = facteurMembre(data.from).bas, cote = pa > pb ? facteurMembre(data.from).cote : facteurMembre(pathB).cote;
            showFeedback(`${A.label} simplifié dans les deux membres (on ${bas ? 'multiplie' : 'divise'} les deux membres par ${A.label})${reste ? ` : il restera ${A.label}${reste > 1 ? puiss(reste) : ''} dans le membre de ${cote === 'left' ? 'gauche' : 'droite'}` : ''}.`, null);
        } else {
            const ou = pa > pb ? fA.niveau : fB.niveau;
            showFeedback(`${A.label} simplifié${reste ? ` : il restera ${A.label}${reste > 1 ? puiss(reste) : ''} au ${ou === 'num' ? 'numérateur' : 'dénominateur'}` : ' : il disparaîtra du numérateur et du dénominateur'}.`, null);
        }
        refreshView();
        // première paire barrée dans cet éditeur : la suite est expliquée
        // (sous un terme barré du dénominateur : la fraction reste visible)
        if (!bulleBarreVue) {
            bulleBarreVue = true;
            const z = part('ed-zone'), bas = z && z.querySelector('.frac-den-wrap .eq-barre');
            montrerBulle(bas ? bas.closest('.eq-tile, .eq-tile-locked') : z && z.querySelector('.eq-barre'), msg('BULLE_BARRE'), !!bas);
        }
        return true;
    }
    // « ✓ Vérifier l'étape » : les simplifications s'appliquent, les termes barrés s'effacent
    function appliquerBarres() {
        for (let garde = 0; garde < 500; garde++) {
            const t = tuilesEq().find(x => x.it.sim);
            if (!t) return;
            const p = puissEff(t.it);
            if (p > 0) { t.it.pow = p; delete t.it.sim; sansPow1(t.it); }
            else retirerTuile(t.path, t.idx);     // la zone vidée se range (fraction, facteur)
        }
    }
    // bulle d'explication au-dessus de l'élément, ou au-dessous (dessous, ou pas la place) ; fermée au prochain appui
    let bulle = null, bulleChoixVue = false, bulleBarreVue = false;
    function fermerBulle() { if (bulle) { bulle.remove(); bulle = null; } }
    function montrerBulle(el, html, dessous) {
        fermerBulle();
        if (!el || !racine || !racine.contains(el)) return;
        bulle = document.createElement('div');
        bulle.className = 'eq-bulle';
        bulle.setAttribute('role', 'status');
        bulle.innerHTML = html;
        racine.appendChild(bulle);
        // mesurée en haut à gauche (toute la largeur disponible), sans l'animation d'apparition (offset*),
        // largeur figée avant le placement : la hauteur mesurée ne change plus
        bulle.style.left = bulle.style.top = '0px';
        bulle.style.width = bulle.offsetWidth + 'px';
        const r = racine.getBoundingClientRect(), t = el.getBoundingClientRect(), b = { width: bulle.offsetWidth, height: bulle.offsetHeight };
        const cx = t.left + t.width / 2 - r.left;
        const x = Math.max(0, Math.min(r.width - b.width, cx - b.width / 2));
        let y = t.top - r.top - b.height - 12;
        if (dessous || y < 0) { y = t.bottom - r.top + 12; bulle.classList.add('eq-bulle-bas'); }
        bulle.style.left = x + 'px';
        bulle.style.top = y + 'px';
        bulle.style.setProperty('--fl', Math.max(14, Math.min(b.width - 14, cx - x)) + 'px');   // pointe vers l'élément
    }
    document.addEventListener('pointerdown', fermerBulle, true);
    // sélection et second appui (EPT) : dans cet éditeur seulement, pour un exercice de simplification
    EPT.ecouter({
        paire(a, b) {
            if (!racine || resolved || !simplifiable() || !racine.contains(a) || !racine.contains(b)) return false;
            if (!a.dataset.path || !b.dataset.path || a.dataset.idx == null || b.dataset.idx == null) return false;
            const za = getNode(a.dataset.path), zb = getNode(b.dataset.path);
            const A = za && za.items && za.items[+a.dataset.idx], B = zb && zb.items && zb.items[+b.dataset.idx];
            if (!A || !B || A.id !== B.id) return false;     // grandeurs différentes : nouvelle sélection
            processSimplif({ from: a.dataset.path, idx: +a.dataset.idx }, b.dataset.path, +b.dataset.idx);
            return true;
        },
        // première grandeur choisie qui peut se simplifier : la bulle explique le second appui
        choix(el) {
            if (!racine || resolved || !simplifiable() || bulleChoixVue || !racine.contains(el) || !el.dataset.path) return;
            if (!partenaire(el.dataset.path, +el.dataset.idx)) return;
            const z = getNode(el.dataset.path), it = z && z.items[+el.dataset.idx];
            bulleChoixVue = true;
            // terme du dénominateur : bulle au-dessous, pour laisser voir le numérateur (et inversement)
            const fd = fracDe(el.dataset.path);
            montrerBulle(el, msg('BULLE_CHOIX').replace('{g}', '<b>' + (it ? it.label : '') + '</b>'), !!(fd && fd.niveau === 'den'));
        },
    });
    // entrer sous la racine : un facteur du même produit y entre au carré (a √X = √(a² X))
    function processEntrer(data, funcPath, silencieux) {
        const fn = getNode(funcPath);
        const p = funcPath.split('.'), parSeq = p.slice(0, -1).join('.');
        const reste = data.from.startsWith(parSeq + '.') ? data.from.slice(parSeq.length + 1).split('.') : null;
        if (!fn || fn.fn !== 'sqrt' || !reste || reste[0] === p[p.length - 1] || reste.some(x => x === 'inner' || /^term/.test(x))) { afficherRefus(msg('MSG_ENTRER')); return; }
        // le facteur entre en bas de la racine s'il est au dénominateur, ou si la racine elle-même est au dénominateur (pas les deux)
        const den = (REGLES.level(data.from) === 'den') !== (REGLES.level(funcPath) === 'den');
        const t = Object.assign({}, data.item); t.pow = (t.pow || 1) * 2;
        // contenu de la racine : fraction (numérateur ou dénominateur), ou produit (qui devient une fraction pour un dénominateur)
        let ip = funcPath + '.inner', I = getNode(ip);
        while (I.kind === 'seq' && I.slots.length === 1) { ip += '.0'; I = I.slots[0]; }
        let zp;
        if (I.kind === 'frac') zp = zoneSimple(ip + (den ? '.den' : '.num'));
        else if (den) { setNode(ip, frac(I.kind === 'simple' ? I : seq([I]), simple([]))); zp = ip + '.den'; }
        else zp = zoneSimple(ip);
        if (!zp) { afficherRefus(msg('MSG_ENTRER')); return; }
        const zone = getNode(zp);
        retirerTuile(data.from, data.idx);
        // retirer a pu déplacer la racine (un facteur du produit a disparu) : on retrouve la zone par son nœud
        zp = cheminDe(zone);
        if (!zp) return;
        ajouterTuile(zp, t);
        if (silencieux) return;
        showFeedback(`${data.item.label} entre sous la racine au carré : ${data.item.label} × √… = √(${data.item.label}² × …).`, null);
        refreshView();
    }
    function processEntrerDen(fracPath, funcPath) {
        const f = getNode(fracPath), fn = getNode(funcPath);
        if (!f || f.kind !== 'frac' || f.den.kind !== 'simple' || !fn) { afficherRefus(msg('MSG_ENTRER')); return; }
        const noms = [];
        // les grandeurs une à une (le dénominateur se vide, la fraction se range) ; la racine est suivie par son nœud
        while (true) {
            const g = getNode(fracPath);
            if (!g || g.kind !== 'frac' || g.den.kind !== 'simple' || !g.den.items.length || zoneUn(g.den)) break;
            const it = g.den.items[0];
            noms.push(it.label);
            const k = cheminDe(fn);
            if (!k) break;
            processEntrer({ type:'move', from: fracPath + '.den', idx: 0, id: it.id, label: lab(it), item: Object.assign({}, it) }, k, true);
            funcPath = cheminDe(fn);
            if (getNode(fracPath) !== g) break;
        }
        showFeedback(`${noms.join(', ')} entre${noms.length > 1 ? 'nt' : ''} sous la racine au carré, au dénominateur.`, null);
        refreshView();
    }
    // chemin d'un nœud dans l'équation (recherche par identité)
    function cheminDe(cible) {
        function voir(n, p) {
            if (n === cible) return p;
            if (!n || typeof n !== 'object') return null;
            if (n.kind === 'seq') { for (let i = 0; i < n.slots.length; i++) { const r = voir(n.slots[i], p + '.' + i); if (r) return r; } }
            else if (n.kind === 'frac') return voir(n.num, p + '.num') || voir(n.den, p + '.den');
            else if (n.kind === 'func') return voir(n.inner, p + '.inner');
            else if (n.kind === 'sum') { for (let i = 0; i < n.terms.length; i++) { const r = voir(n.terms[i].node, p + '.term' + i); if (r) return r; } }
            return null;
        }
        return voir(state.left, 'left') || voir(state.right, 'right');
    }
    // remplacer une grandeur par une expression (outil de la réserve « t = … »)
    function processSubst(data, el) {
        const nomG = data.nom;
        if (!el || !el.dataset.path) { afficherRefus(msg('MSG_SUBST').replace('{g}', nomG)); return; }
        const path = el.dataset.path, idx = +el.dataset.idx, z = getNode(path), it = z && z.items && z.items[idx];
        if (!it || it.id !== data.id) { afficherRefus(msg('MSG_SUBST').replace('{g}', nomG)); return; }
        // expression écrite dans l'autre éditeur : produits en plusieurs cases (ρ × V glissé à la main) regroupés
        let R = aplatir(JSON.parse(JSON.stringify(data.noeud)));
        while (R.kind === 'seq' && R.slots.length === 1) R = R.slots[0];
        const p = it.pow || 1;
        if (R.kind === 'frac' && R.num.kind === 'simple' && R.den.kind === 'simple') {
            // fraction de grandeurs : le numérateur prend la place de la grandeur, le dénominateur passe de l'autre côté du trait
            const puis = l => l.items.filter(x => x.id !== 'one').map(x => sansPow1(Object.assign({}, x, { pow: (x.pow || 1) * p })));
            // (au dénominateur aussi : X / (U / L) = X × L / U, U prend la place de E, L passe au numérateur)
            const fd = fracDe(path);
            const ici = puis(R.num), la = puis(R.den);
            z.items.splice(idx, 1, ...ici);
            if (!z.items.length) z.items.push(tile('one', '1'));
            if (la.length) {
                if (fd) { const op = zoneSimple(fd.frac + (fd.niveau === 'num' ? '.den' : '.num')); la.forEach(t => { const o = getNode(op); if (zoneUn(o)) o.items = []; o.items.push(t); }); }
                else setNode(path, frac(simple(z.items), simple(la)));
            }
        } else if (R.kind === 'simple' && R.items.length && !R.items.some(isOperatorTile)) {
            // produit de grandeurs (n = c V) : ses grandeurs prennent la place de la grandeur, dans le même produit
            // (puissances multipliées ; une grandeur déjà présente voit sa puissance augmenter : I × I = I²)
            z.items.splice(idx, 1);
            R.items.forEach(t => { if (t.id !== 'one') ajouterTuile(path, Object.assign({}, t, { pow: (t.pow || 1) * p })); });
            if (!z.items.length) z.items.push(tile('one', '1'));
        } else {
            if (p !== 1) { afficherRefus(msg('MSG_SUBST').replace('{g}', nomG)); return; }
            const pp = path.split('.'), last = pp.pop(), par = getNode(pp.join('.'));
            const dansSeq = par && par.kind === 'seq' && /^\d+$/.test(last);
            // produit en plusieurs cases : ses cases rejoignent celles du produit, sans produit imbriqué
            const cases = R.kind === 'seq' && !R.parenthesized ? R.slots : [R];
            if (dansSeq) {
                z.items.splice(idx, 1);
                par.slots.splice(+last + (z.items.length ? 1 : 0), z.items.length ? 0 : 1, ...cases);
            }
            else if (z.items.length === 1) setNode(path, R);
            else { z.items.splice(idx, 1); setNode(path, seq([z, ...cases])); }
        }
        // réserve : les grandeurs apportées par le remplacement y reviennent si on les efface ; la grandeur remplacée n'y est plus
        if (currentExercise.tiles) {
            tuilesDe({ left: data.noeud, right: simple([]) }).forEach(t => { if (!currentExercise.tiles.some(x => x.id === t.id)) currentExercise.tiles.push({ id: t.id, label: t.label }); });
            if (countIdAnywhere(data.id) === 0) currentExercise.tiles = currentExercise.tiles.filter(t => t.id !== data.id);
        }
        showFeedback(`${nomG} remplacé.`, null);
        refreshView();
        if (rappels.surRemplacement) rappels.surRemplacement(data.id);
    }
    // produit écrit en plusieurs cases (glissers successifs) : produits imbriqués défaits,
    // cases de grandeurs seules regroupées en un seul produit (ρ | V → ρ × V)
    function aplatir(n) {
        if (!n) return n;
        if (n.kind === 'frac') return Object.assign({}, n, { num: aplatir(n.num), den: aplatir(n.den) });
        if (n.kind === 'func') return Object.assign({}, n, { inner: aplatir(n.inner) });
        if (n.kind === 'sum') return Object.assign({}, n, { terms: n.terms.map(t => Object.assign({}, t, { node: aplatir(t.node) })) });
        if (n.kind !== 'seq') return n;
        const slots = [];
        n.slots.map(aplatir).forEach(x => { if (x.kind === 'seq' && !x.parenthesized) slots.push(...x.slots); else slots.push(x); });
        if (!n.parenthesized && slots.length > 1 && slots.every(x => x.kind === 'simple')) {
            const items = [].concat(...slots.map(x => x.items));
            const utiles = items.filter(x => x.id !== 'one');
            return simple(utiles.length ? utiles : items.slice(0, 1));
        }
        return Object.assign({}, n, { slots });
    }
    // forme d'une expression, indépendante de l'ordre des facteurs (fin d'un exercice de simplification)
    function forme(n) {
        while (n.kind === 'seq' && n.slots.length === 1) n = n.slots[0];
        const tuiles = l => l.filter(i => i.id !== 'one').map(i => i.id + '^' + (i.pow || 1)).sort().join(',');
        if (n.kind === 'simple') return 'S[' + tuiles(n.items) + ']';
        if (n.kind === 'frac') return 'F(' + forme(n.num) + '/' + forme(n.den) + ')';
        if (n.kind === 'func') return n.fn + (n.n || '') + '(' + forme(n.inner) + ')';
        if (n.kind === 'sum') return 'Σ(' + n.terms.map(t => (t.sign < 0 ? '-' : '+') + forme(t.node)).sort().join('') + ')';
        const t = [], autres = [];
        n.slots.forEach(x => { while (x.kind === 'seq' && x.slots.length === 1) x = x.slots[0]; if (x.kind === 'simple') t.push(...x.items); else autres.push(forme(x)); });
        const ts = tuiles(t);
        return 'P(' + (ts ? ['S[' + ts + ']'] : []).concat(autres).sort().join('*') + ')';
    }
    function flipEquation() {
        if (resolved) return;
        const tmp = state.left;
        state.left = state.right;
        state.right = tmp;
        refreshView();
    }
    function removeSumTerm(sumPath, termIdx) {
        const sum = getNode(sumPath);
        if (!sum || sum.kind !== 'sum') return null;
        const [removed] = sum.terms.splice(termIdx, 1);
        if (sum.terms.length === 1 && sum.terms[0].sign === 1) {
            let repl = sum.terms[0].node;
            while (repl.kind === 'seq' && repl.slots.length === 1) repl = repl.slots[0];
            setNode(sumPath, repl);
        }
        return removed;
    }
    // le signe "=" sert de reference stable pour corriger la position du
    // fantome apres coup : quand un terme change de cote, le cote qui grossit
    // repousse le "=" (et tout ce qui le suit) du meme nombre de pixels que
    // l'autre cote a retreci — sans cette correction, le fantome reste a une
    // position absolue figee qui finit collee contre le contenu qui vient
    // d'arriver de l'autre cote, comme s'il lui appartenait
    function captureEqSignRect() {
        const el = (part('ed-zone') && part('ed-zone').querySelector('.eq-sign'));
        return el ? el.getBoundingClientRect() : null;
    }
    function processSumTermDrop(sidePath, data) {
        if (sidePath !== 'left' && sidePath !== 'right') return;
        if (data.from === sidePath) { refreshView(); return; }
        if (!REGLES.isLegalSumTerm(data.from, sidePath)) { hadError = true; erreur(); showFeedback(msg('MSG_SUMTERM'), false); return; }
        const srcSum = getNode(data.from);
        const srcTerm = srcSum && srcSum.kind === 'sum' ? srcSum.terms[data.termIdx] : null;
        const showVanishGhost = !!(srcTerm && srcTerm.sign === -1);
        const removed = removeSumTerm(data.from, data.termIdx);
        if (!removed) return;
        const flipped = { sign: -removed.sign, node: removed.node };
        const destSide = getNode(sidePath);
        let destTermIdx;
        // le terme qui arrive se place au plus près du signe = : en tête pour le
        // membre de droite (juste après le =), en fin pour le membre de gauche
        // (juste avant le =)
        if (destSide.slots.length === 1 && destSide.slots[0].kind === 'sum') {
            if (sidePath === 'right') {
                destSide.slots[0].terms.unshift(flipped);
                destTermIdx = 0;
            } else {
                destSide.slots[0].terms.push(flipped);
                destTermIdx = destSide.slots[0].terms.length - 1;
            }
        } else {
            const existing = { sign:1, node: seq(destSide.slots) };
            if (sidePath === 'right') {
                destSide.slots = [ sumNode([flipped, existing]) ];
                destTermIdx = 0;
            } else {
                destSide.slots = [ sumNode([existing, flipped]) ];
                destTermIdx = 1;
            }
        }
        signsToFlash.push({ sidePath: sidePath + '.0', termIdx: destTermIdx });
        refreshView();
        // le "-" qui disparaissait a la source (le terme entier a change de
        // cote) est mime a l'endroit ou le terme vient d'arriver, la ou
        // l'attention de l'eleve se trouve deja juste apres avoir depose
        // l'element — jamais a l'ancien emplacement, que la ligne (centree)
        // peut avoir totalement redistribue par ailleurs
        if (showVanishGhost) flashVanishingSignAtArrival(sidePath, destTermIdx);
    }
    // "multiplie les deux côtés par le dénominateur" : on retire le dénominateur
    // (non vide) d'une fraction et son contenu rejoint, comme facteur
    // multiplicatif, le membre entier de l'autre côté
    function processFracDenDrop(fracPath, destSidePath) {
        if (destSidePath !== 'left' && destSidePath !== 'right') return;
        if (!REGLES.isLegalSumTerm(fracPath, destSidePath)) { hadError = true; erreur(); showFeedback(msg('MSG_FRACDEN'), false); return; }
        const fracNode = getNode(fracPath);
        if (!fracNode || fracNode.kind !== 'frac' || !denHasRealContent(fracNode)) return;
        const denContent = fracNode.den;
        // le dénominateur reste affiché, vide, avec une croix : il n'est pas
        // supprimé automatiquement (l'élève clique la croix s'il veut la fraction
        // en moins, comme partout ailleurs dans l'application)
        fracNode.den = simple([]);
        fracNode.forceDenCross = true;
        const dest = getNode(destSidePath);
        const newSlot = denContent.kind === 'seq' ? (denContent.slots.length === 1 ? denContent.slots[0] : seq(denContent.slots.slice())) : denContent;
        dest.slots.push(newSlot);
        refreshView();
    }
    // une fonction qui multiplie (bloc) passe de l'autre côté : en bas si elle était en haut
    // (les deux membres sont divisés par ce bloc), en facteur si elle était en bas
    function processBlocDrop(fromPath, destSide) {
        if (REGLES.side(fromPath) === destSide) { refreshView(); return; }
        const parts = fromPath.split('.'), idx = +parts.pop(), par = getNode(parts.join('.'));
        if (!par || par.kind !== 'seq' || !par.slots[idx]) return;
        const enBas = REGLES.level(fromPath) === 'den';
        const bloc = par.slots.splice(idx, 1)[0];
        const dest = getNode(destSide);
        if (enBas) { dest.slots.push(bloc); refreshView(); return; }
        const contenu = dest.slots.length === 1 ? dest.slots[0] : seq(dest.slots.slice());
        if (contenu.kind === 'frac' && dest.slots.length === 1) {
            const d = contenu.den;
            if (isSlotEmpty(d) || (d.kind === 'simple' && d.items.length === 1 && d.items[0].id === 'one')) contenu.den = bloc;
            else contenu.den = seq((d.kind === 'seq' ? d.slots.slice() : [d]).concat([bloc]));
            delete contenu.forceDenCross;
        } else {
            dest.slots = [ frac(contenu, bloc) ];
        }
        refreshView();
    }
    // traite tout le contenu d'un membre comme un seul bloc (nécessaire avant de
    // pouvoir le glisser dans une fraction quand ce n'est pas une simple grandeur)
    function processParenDrop(sidePath) {
        if (sidePath !== 'left' && sidePath !== 'right') return;
        const side = getNode(sidePath);
        if (!side || side.kind !== 'seq') return;
        side.parenthesized = true;
        refreshView();
    }
    // multiplie les deux membres par -1 (change le signe d'une grandeur isolée)
    // multiplie UN membre par -1 : par distributivité, chaque terme additif
    // change de signe ; aucune tuile "-1" n'apparaît jamais, seul le signe change
    // quand un signe "−" affiche va disparaitre completement (la somme se
    // simplifie en un contenu positif implicite, sans qu'aucun "+" ne le
    // remplace visuellement), le repli habituel (flasher un element du rendu
    // final) ne peut rien animer puisque ce signe n'existe plus apres coup : on
    // capture sa position AVANT la mutation pour pouvoir quand meme le faire
    // tourner, exactement comme les autres signes, avant qu'il ne s'efface
    function captureVanishingSignRect(sidePath) {
        const s = getNode(sidePath);
        if (!(s.slots.length === 1 && s.slots[0].kind === 'sum' && s.slots[0].terms.length === 1 && s.slots[0].terms[0].sign === -1)) return null;
        const el = racine.querySelector(`.sum-sign[data-sum-path="${sidePath}.0"][data-term-idx="0"]`);
        return el ? el.getBoundingClientRect() : null;
    }
    function spawnVanishGhost(rect) {
        const ghost = document.createElement('span');
        ghost.textContent = '−';
        ghost.className = 'sum-sign sign-vanish-ghost';
        ghost.style.cssText = `position:fixed; left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:9999;`;
        document.body.appendChild(ghost);
        setTimeout(() => ghost.remove(), 1300);
    }
    function flashVanishingSign(rect, eqBefore) {
        if (eqBefore) {
            const eqAfterEl = (part('ed-zone') && part('ed-zone').querySelector('.eq-sign'));
            if (eqAfterEl) {
                const eqAfter = eqAfterEl.getBoundingClientRect();
                rect = {
                    left: rect.left + (eqAfter.left - eqBefore.left),
                    top: rect.top + (eqAfter.top - eqBefore.top),
                    width: rect.width, height: rect.height,
                };
            }
        }
        spawnVanishGhost(rect);
    }
    // place le fantome exactement a l'endroit ou le terme deplace vient
    // d'arriver (apres le rendu) : sur le signe qui y est desormais affiche s'il
    // y en a un, sinon juste avant le terme lui-meme (cas d'un premier terme
    // positif implicite, sans aucun signe affiche)
    function flashVanishingSignAtArrival(sidePath, termIdx) {
        const sumPath = sidePath + '.0';
        const signEl = racine.querySelector(`.sum-sign[data-sum-path="${sumPath}"][data-term-idx="${termIdx}"], .sum-sign-drag[data-sum-path="${sumPath}"][data-term-idx="${termIdx}"]`);
        if (signEl) {
            spawnVanishGhost(signEl.getBoundingClientRect());
            return;
        }
        const termEl = racine.querySelector(`.sum-term[data-path="${sumPath}"][data-term-idx="${termIdx}"]`) || racine.querySelector(`.eq-side[data-path="${sidePath}"]`);
        if (!termEl) return;
        const r = termEl.getBoundingClientRect();
        spawnVanishGhost({ left: r.left - 20, top: r.top, width: 20, height: r.height });
    }
    function negateSide(sidePath) {
        if (barresEnAttente()) { showFeedback(msg('MSG_BARRES'), null); return; }
        if (sidePath !== 'left' && sidePath !== 'right') return;
        const s = getNode(sidePath);
        const vanishRect = captureVanishingSignRect(sidePath);
        const eqBefore = vanishRect ? captureEqSignRect() : null;
        if (s.slots.length === 1 && s.slots[0].kind === 'sum') {
            s.slots[0].terms.forEach((t, i) => {
                t.sign = -t.sign;
                signsToFlash.push({ sidePath: sidePath + '.0', termIdx: i });
            });
            if (s.slots[0].terms.length === 1 && s.slots[0].terms[0].sign === 1) {
                let repl = s.slots[0].terms[0].node;
                while (repl.kind === 'seq' && repl.slots.length === 1) repl = repl.slots[0];
                s.slots[0] = repl;
            }
        } else {
            const innerSeq = s.slots.length === 1 ? seq([s.slots[0]]) : seq(s.slots.slice());
            s.slots = [ sumNode([{ sign: -1, node: innerSeq }]) ];
            signsToFlash.push({ sidePath: sidePath + '.0', termIdx: 0 });
        }
        refreshView();
        if (vanishRect) flashVanishingSign(vanishRect, eqBefore);
    }
    // applique l'outil (fonction réciproque) aux deux membres : le côté qui
    // porte déjà la fonction annulée se déplie, l'autre se retrouve enveloppé
    function unwrapSideFunc(side) {
        const s = getNode(side);
        const inner = s.slots[0].inner;
        s.slots = (inner.kind === 'seq') ? inner.slots.slice() : [inner];
    }
    function wrapSideInFunc(side, fn) {
        const s = getNode(side);
        const inner = s.slots.length === 1 ? s.slots[0] : seq(s.slots.slice());
        s.slots = [ func(fn, inner) ];
    }
    // aplatit les seq a une seule zone pour retrouver le "vrai" noeud
    function flattenSeq(n) {
        while (n.kind === 'seq' && n.slots.length === 1) n = n.slots[0];
        return n;
    }
    // la grandeur a isoler apparait-elle quelque part dans ce noeud ? sert a
    // distinguer, de facon generique, une fonction encore "a demeler" (elle
    // contient la grandeur cherchee : isoler d'abord serait la bonne etape) d'une
    // fonction qui ne concerne pas du tout cette grandeur (elle appartient a
    // l'autre membre, ex. sin(i2) quand on isole i1) : dans ce dernier cas
    // l'envelopper avec le reste de l'expression est la seule etape possible,
    // jamais une erreur d'etourderie a signaler
    function nodeContainsId(node, id) {
        if (node.kind === 'simple') return node.items.some(i => i.id === id);
        if (node.kind === 'func') return nodeContainsId(node.inner, id);
        if (node.kind === 'frac') return nodeContainsId(node.num, id) || nodeContainsId(node.den, id);
        if (node.kind === 'sum') return node.terms.some(t => nodeContainsId(t.node, id));
        return node.slots.some(sl => nodeContainsId(sl, id));
    }
    // une fonction reciproque n'annule QUE sa fonction exacte, isolee seule de ce
    // cote de l'equation : si cette fonction precise est presente mais multipliee
    // / divisee par autre chose, ou precedee d'un signe -, l'utiliser directement
    // serait ambigu (annuler la fonction, ou l'envelopper avec le reste ?). Ce
    // controle est generique (base uniquement sur RECIPROCAL/le noeud 'func'),
    // donc valable pour n'importe quelle fonction/reciproque ajoutee plus tard.
    // il ne s'applique qu'aux fonctions qui contiennent effectivement la grandeur
    // a isoler (targetId) : une fonction similaire trouvee ailleurs, sans lien
    // avec cette grandeur, peut toujours etre englobee sans avertissement.
    function findNonIsolatedReciprocalMatch(side, o, targetId) {
        const e = exposant(o.fn, o.n);
        const isTargetFunc = n => {
            n = flattenSeq(n);
            // grandeur cherchée élevée à une puissance que l'outil annule (I² dans R × I²)
            if (n.kind === 'simple' && e != null) return n.items.some(it => it.pow && Math.abs(it.pow * e - 1) < 1e-9 && (!targetId || it.id === targetId));
            return annule(o, n) && (!targetId || nodeContainsId(n.inner, targetId));
        };
        // precedee d'un signe - (somme reduite a un seul terme negatif)
        if (side.slots.length === 1 && side.slots[0].kind === 'sum' && side.slots[0].terms.length === 1
            && side.slots[0].terms[0].sign === -1 && isTargetFunc(side.slots[0].terms[0].node)) {
            return 'sign';
        }
        // multipliee par un ou plusieurs autres facteurs (plusieurs zones dans la sequence)
        if (side.slots.length > 1 && side.slots.some(isTargetFunc)) {
            return 'factor';
        }
        // grandeur à une puissance multipliée par d'autres grandeurs dans la même zone (R × I²)
        if (side.slots.length === 1 && side.slots[0].kind === 'simple' && side.slots[0].items.length > 1 && isTargetFunc(side.slots[0])) {
            return 'factor';
        }
        // divisee par quelque chose, ou diviseur de quelque chose (fraction dont
        // le numerateur ou le denominateur est exactement la fonction)
        if (side.slots.length === 1 && side.slots[0].kind === 'frac'
            && (isTargetFunc(side.slots[0].num) || isTargetFunc(side.slots[0].den))) {
            return 'frac';
        }
        return null;
    }
    // outil appliqué à un membre : la fonction qu'il annule disparaît, sinon le membre entier
    // est enveloppé (l'outil se dépose sur les deux membres, l'un après l'autre)
    function applyFuncTool(tool, side) {
        if (side !== 'left' && side !== 'right') return;
        if (barresEnAttente()) { showFeedback(msg('MSG_BARRES'), null); return; }
        if (tool === 'inv') { inverserMembre(side); return; }
        const o = outil(tool);
        const s = getNode(side);
        // une grandeur seule (v, v², T⁴) : la puissance change sur la tuile elle-même,
        // la tuile reste déplaçable (v² = v × v se déplace comme une grandeur)
        const e = exposant(o.fn, o.n);
        if (e != null && s.slots.length === 1 && s.slots[0].kind === 'simple' && s.slots[0].items.length === 1) {
            const it = s.slots[0].items[0], p = (it.pow || 1) * e;
            if (Math.abs(p - Math.round(p)) < 1e-9 && Math.round(p) >= 1) {
                if (Math.round(p) === 1) delete it.pow; else it.pow = Math.round(p);
                refreshView();
                return;
            }
        }
        if (s.slots.length === 1 && annule(o, s.slots[0])) {
            unwrapSideFunc(side);
            refreshView();
            return;
        }
        if (findNonIsolatedReciprocalMatch(s, o, currentExercise && currentExercise.targetId)) {
            hadError = true; erreur();
            showFeedback(msg('RECIPROQUE'), false);
            return;
        }
        const contenu = s.slots.length === 1 ? s.slots[0] : seq(s.slots.slice());
        s.slots = [ func(o.fn, contenu, o.n) ];
        refreshView();
    }
    // outil 1/x : on prend l'inverse d'un membre. 1/A devient A, A/B devient B/A,
    // tout autre contenu A devient 1/A
    function inverserMembre(side) {
        const s = getNode(side);
        const c = s.slots.length === 1 ? s.slots[0] : seq(s.slots.slice());
        if (c.kind === 'frac') {
            const un = c.num.kind === 'simple' && c.num.items.length === 1 && c.num.items[0].id === 'one';
            if (un) s.slots = c.den.kind === 'seq' ? c.den.slots.slice() : [c.den];
            else s.slots = [ frac(c.den, c.num) ];
        } else {
            s.slots = [ frac(simple([tile('one', '1')]), c) ];
        }
        refreshView();
    }
    function processSqrtDrop() {}

    // ═══════════════════════════════════════════════════════════════
    // PALETTE
    // ═══════════════════════════════════════════════════════════════
    function countIdAnywhere(id) {
        function c(node) {
            if (!node) return 0;
            if (node.kind === 'simple') return node.items.filter(i => i.id === id).length;
            if (node.kind === 'func') return c(node.inner);
            if (node.kind === 'frac') return c(node.num) + c(node.den);
            if (node.kind === 'sum') return node.terms.reduce((s, t) => s + c(t.node), 0);
            return node.slots.reduce((s, sl) => s + c(sl), 0);
        }
        return c(state.left) + c(state.right);
    }
    function addPaletteTile(t) {
        const pal = part('ed-palette');
        const el = document.createElement('div');
        el.className = 'palette-tile';
        el.innerHTML = lab(t);
        enableTileDrag(el, { type:'tile', id:t.id, label:lab(t), item:Object.assign({}, t) });
        pal.appendChild(el);
    }
    // outil « grandeur = expression » : se dépose sur la grandeur à remplacer
    function addSubstPaletteTile(r) {
        const pal = part('ed-palette');
        if (!pal) return;
        const el = document.createElement('div');
        el.className = 'palette-tile palette-subst';
        el.dataset.id = r.id;
        el.innerHTML = `<span class="eq-tile-static">${r.label}</span><span class="eq-sign">=</span>${renderStatic(r.noeud)}`;
        enableTileDrag(el, { type:'subst', id:r.id, nom:r.label, noeud:r.noeud });
        pal.appendChild(el);
    }
    function addFracPaletteTile() {
        const pal = part('ed-palette');
        if (!pal) return;
        const el = document.createElement('div');
        el.className = 'palette-tile palette-frac';
        el.innerHTML = '<span class="dots">···</span><span class="frac-line"></span><span class="dots">···</span>';
        enableTileDrag(el, { type:'frac' });
        pal.appendChild(el);
    }
    function addFuncToolTile(fn) {
        const pal = part('ed-palette');
        if (!pal) return;
        const el = document.createElement('div');
        const note = noteOutil(fn);
        el.className = 'palette-tile func-tool' + (note ? ' avec-note' : '');
        el.innerHTML = `<span>${libelleOutil(fn)}</span>` + (note ? `<span class="outil-note">${note}</span>` : '');
        DragDrop.enable(el, {
            racine: part('ed-zone') || racine,
            zoneSelector: '.eq-side',
            dragOverClass: 'drag-over',
            onDrop: (item, zone) => {
                const side = zone && racine.contains(zone) && zone.closest('.eq-side[data-path="left"], .eq-side[data-path="right"]');
                if (side) applyFuncTool(fn, side.dataset.path);
            },
        });
        pal.appendChild(el);
    }
    function addParenPaletteTile() {
        const pal = part('ed-palette');
        if (!pal) return;
        const el = document.createElement('div');
        el.className = 'palette-tile func-tool';
        el.innerHTML = '( )';
        enableTileDrag(el, { type:'paren' });
        pal.appendChild(el);
    }
    function addNegPaletteTile() {
        const pal = part('ed-palette');
        if (!pal) return;
        const el = document.createElement('div');
        el.className = 'palette-tile func-tool';
        el.innerHTML = '×(−1)';
        DragDrop.enable(el, {
            racine: part('ed-zone') || racine,
            zoneSelector: '.eq-side',
            dragOverClass: 'drag-over',
            onDrop: (item, zone) => {
                const side = zone && racine.contains(zone) && zone.closest('.eq-side[data-path="left"], .eq-side[data-path="right"]');
                if (side) negateSide(side.dataset.path);
            },
        });
        pal.appendChild(el);
    }
    const REUSABLE_TILE_IDS = new Set(['one', 'times', 'plus', 'minus']);
    function buildPalette() {
        const pal = part('ed-palette');
        if (!pal || !currentExercise) return;
        pal.innerHTML = '';
        // les grandeurs effacées reviennent dans la réserve ; le 1 y est toujours
        (currentExercise.remplacements || []).forEach(addSubstPaletteTile);
        // réserve réduite aux outils de l'exercice (simplification d'une expression)
        if (currentExercise.reserveSeule) { (currentExercise.funcTools || []).forEach(addFuncToolTile); crochets(pal); return; }
        const tuiles = (currentExercise.tiles || []).slice();
        if (!tuiles.some(t => t.id === 'one')) tuiles.push(tile('one', '1'));
        tuiles.filter(t => REUSABLE_TILE_IDS.has(t.id) || countIdAnywhere(t.id) === 0).forEach(addPaletteTile);
        addFracPaletteTile();
        (currentExercise.funcTools || []).forEach(addFuncToolTile);
        if (currentExercise.needsParenTool) addParenPaletteTile();
        // l'outil ×(-1) reste toujours disponible : il ne fait jamais de mal a
        // utiliser (il ne fait que changer un signe) et son absence occasionnelle
        // empechait de corriger une erreur de signe sur certaines questions
        addNegPaletteTile();
        crochets(pal);
    }

    // ═══════════════════════════════════════════════════════════════
    // ÉVALUATION ALGÉBRIQUE
    // ═══════════════════════════════════════════════════════════════
    function tokenValue(id, v) {
        if (id === 'one') return 1;
        return (v && id in v) ? v[id] : NaN;
    }
    function evaluateNode(node, v) {
        if (node.kind === 'func') {
            const x = evaluateNode(node.inner, v);
            switch (node.fn) {
                case 'sqrt': return Math.sqrt(x);
                case 'sq': return x * x;
                case 'cube': return x * x * x;
                case 'cbrt': return Math.cbrt(x);
                case 'pow': return Math.pow(x, node.n);
                case 'proot': return Math.pow(x, 1 / node.n);
                case 'sin': return Math.sin(x);
                case 'asin': return Math.asin(x);
                case 'cos': return Math.cos(x);
                case 'acos': return Math.acos(x);
                case 'tan': return Math.tan(x);
                case 'atan': return Math.atan(x);
                case 'log': return Math.log10(x);
                case 'pow10': return Math.pow(10, x);
                case 'ln': return Math.log(x);
                case 'exp': return Math.exp(x);
            }
            return NaN;
        }
        if (node.kind === 'seq') return node.slots.reduce((p, s) => p * evaluateNode(s, v), 1);
        if (node.kind === 'frac') return evaluateNode(node.num, v) / evaluateNode(node.den, v);
        if (node.kind === 'sum') return node.terms.reduce((s, t) => s + t.sign * evaluateNode(t.node, v), 0);
        if (node.items.length === 0) return NaN;
        let terms = [], termValue = 1, sign = 1;
        node.items.forEach(it => {
            if (it.id === 'plus')       { terms.push(sign * termValue); termValue = 1; sign = 1; }
            else if (it.id === 'minus') { terms.push(sign * termValue); termValue = 1; sign = -1; }
            else if (it.id === 'times') { /* juxtaposition = produit */ }
            else termValue *= Math.pow(tokenValue(it.id, v), it.pow || 1);
        });
        terms.push(sign * termValue);
        return terms.reduce((s, t) => s + t, 0);
    }
    function isSlotEmpty(node) {
        if (node.kind === 'simple') return node.items.length === 0;
        if (node.kind === 'func') return isSlotEmpty(node.inner);
        if (node.kind === 'frac') return isSlotEmpty(node.num) || isSlotEmpty(node.den);
        if (node.kind === 'sum') return node.terms.some(t => isSlotEmpty(t.node));
        return node.slots.some(isSlotEmpty);
    }
    // les « 1 » inutiles : un 1 qui multiplie autre chose, ou un 1 seul au dénominateur.
    // Un 1 seul au numérateur (1/OA), ou seul dans un membre, est utile.
    function countOnesIn(node, ctx) {
        ctx = ctx || {};
        if (node.kind === 'simple') {
            const uns = node.items.filter(i => i.id === 'one').length;
            if (node.items.length > 1) return uns;
            return uns && (ctx.den || ctx.facteur) ? uns : 0;
        }
        if (node.kind === 'func') return countOnesIn(node.inner);
        if (node.kind === 'frac') return countOnesIn(node.num, {}) + countOnesIn(node.den, { den: true });
        if (node.kind === 'sum') return node.terms.reduce((s, t) => s + countOnesIn(t.node), 0);
        const plusieurs = node.slots.length > 1;
        return node.slots.reduce((s, sl) => s + countOnesIn(sl, plusieurs ? { facteur: true } : ctx), 0);
    }
    function isFullyIsolatedSeq(node, targetId) {
        return node && node.kind === 'seq' && node.slots.length === 1
            && node.slots[0].kind === 'simple' && node.slots[0].items.length === 1
            && node.slots[0].items[0].id === targetId && !node.slots[0].items[0].pow;
    }
    function isIsolatedSeq(node, targetId) {
        if (!node || node.kind !== 'seq' || node.slots.length !== 1) return false;
        const s = node.slots[0];
        if (s.kind === 'simple') return s.items.length === 1 && s.items[0].id === targetId && !s.items[0].pow;
        if (s.kind === 'frac') return s.num.kind === 'simple' && s.num.items.length === 1 && s.num.items[0].id === targetId && !s.num.items[0].pow
            && s.den.kind === 'simple' && s.den.items.length === 1 && s.den.items[0].id === 'one';
        return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // ÉDITEUR DE RÉSOLUTION (questions notées)
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // ÉDITEUR AFFICHÉ DANS LA PAGE
    // ═══════════════════════════════════════════════════════════════
    function solveEditorHTML(cfg) {
        const pouce = cfg && cfg.aides && cfg.aides.length ? '<button type="button" class="btn-small ed-pouce">Un coup de pouce\u00a0?</button>' : '';   // à côté de « Vérifier l'étape »
        return `
        <div class="ed-tete ep-barre">
            <span class="ed-titre">Ta résolution</span>
            <span class="ed-tete-b"><button type="button" class="btn-small ep-annuler" disabled>↶ Annuler</button><button type="button" class="btn-small ed-recommencer">↺ Recommencer</button></span>
        </div>
        <div class="ed-hist ep-fige"></div>
        <div class="ed-travail">
            <p class="ed-aide-t">Déplace les éléments et utilise les outils pour écrire la grandeur cherchée <b>seule, à gauche</b>, puis vérifie l'étape.</p>
            <div class="ed-cadre"><span class="ed-isoler"></span><div class="eq-row ed-zone"></div></div>
            <p class="ed-pal-t">Réserve : glisse un élément ou un outil dans l'équation</p>
            <div class="ed-palette ep-palette"></div>
            <div class="ed-verif">${pouce}<button type="button" class="btn-primary ed-verifier">✓ Vérifier l'étape</button></div>
        </div>
        <div class="ed-retour" aria-live="polite"></div>`;
    }
    // affiche l'éditeur d'un exercice dans zone
    function monter(zone, cfg, r) {
        if (window.DragDrop) DragDrop.cleanupGhosts();
        rappels = r || {};
        racine = document.createElement('div');
        racine.className = 'ed ep-edit';
        racine.innerHTML = solveEditorHTML(cfg);
        zone.innerHTML = '';
        zone.appendChild(racine);
        // commandes dessinées dans l'équation (effacer, supprimer une case, inverser) :
        // un seul gestionnaire par éditeur, pas de code dans le HTML (plusieurs éditeurs par page)
        racine.addEventListener('click', e => {
            const c = e.target.closest && e.target.closest('[data-eq-sup], [data-eq-den], [data-eq-case], [data-eq-inv]');
            if (!c || !racine.contains(c)) return;
            e.stopPropagation();
            if (c.dataset.eqSup) { const k = c.dataset.eqSup.lastIndexOf('|'); deleteItem(c.dataset.eqSup.slice(0, k), +c.dataset.eqSup.slice(k + 1)); }
            else if (c.dataset.eqDen) deleteDen(c.dataset.eqDen);
            else if (c.dataset.eqCase) deleteEmptySlot(c.dataset.eqCase);
            else flipEquation();
        });
        racine.querySelector('.ep-annuler').addEventListener('click', annulerAction);
        const bPouce = racine.querySelector('.ed-pouce');
        if (bPouce) bPouce.addEventListener('click', coupDePouce);
        racine.querySelector('.ed-recommencer').addEventListener('click', resetSolveExercise);
        racine.querySelector('.ed-verifier').addEventListener('click', verifyStep);
        startSolveExercise(cfg);
        return racine;
    }
    // étiquette de la grandeur à isoler (celle de sa tuile)
    function etiquetteCible(cfg) {
        const t = (cfg.tiles || []).find(x => x.id === cfg.targetId);
        return t ? t.label : cfg.targetId;
    }
    function startSolveExercise(cfg) {
        currentExercise = cfg;
        state = { left: cfg.initialLeft(), right: cfg.initialRight() };
        // grandeur à isoler, rappelée en haut à gauche du cadre de résolution
        const iso = part('ed-isoler');
        if (iso) iso.innerHTML = cfg.objectif || 'À isoler\u00a0: <b>' + etiquetteCible(cfg) + '</b>';
        const ai = part('ed-aide-t');
        if (ai && cfg.consigne) ai.innerHTML = cfg.consigne;
        annul.vider();
        history = [JSON.parse(JSON.stringify(state))];
        stepOneValidated = true;
        resolved = false;
        hadError = false;
        activeHighlightId = null;
        refreshView();
        renderHistory();
    }
    function resetSolveExercise() {
        if (window.DragDrop) DragDrop.cleanupGhosts();
        if (!currentExercise || resolved) return;
        state = { left: currentExercise.initialLeft(), right: currentExercise.initialRight() };
        annul.vider();
        history = [JSON.parse(JSON.stringify(state))];
        activeHighlightId = null;
        refreshView();
        renderHistory();
        showFeedback('', false);
    }
    // l'équation affichée est-elle juste ? (5 tirages de valeurs)
    function equationJuste(st) {
        for (let i = 0; i < 5; i++) {
            const v = currentExercise.sample();
            const l = evaluateNode(st.left, v);
            const r = evaluateNode(st.right, v);
            if (!isFinite(l) || !isFinite(r) || Math.abs(l - r) > 1e-6 * Math.max(1, Math.abs(r))) return false;
        }
        return true;
    }
    function verifyStep() {
        if (resolved || !currentExercise) return;
        // termes barrés : ils s'effacent (simplification appliquée) avant la vérification
        if (barresEnAttente()) { EPT.deselectionner(); fermerBulle(); appliquerBarres(); refreshView(); }
        if (isSlotEmpty(state.left) || isSlotEmpty(state.right)) {
            showFeedback(msg('VIDE'), false);
            return;
        }
        if (JSON.stringify(state) === JSON.stringify(history[history.length - 1])) {
            showFeedback(msg('INCHANGE'), false);
            return;
        }
        if (!equationJuste(state)) {
            hadError = true; erreur();
            showFeedback(msg('FAUX'), false);
            return;
        }
        history.push(JSON.parse(JSON.stringify(state)));
        renderHistory();

        // contrôle propre à l'exercice (combiner des équations) : { fini } ou { message } (étape juste, à poursuivre)
        if (currentExercise.controle) {
            const c = currentExercise.controle(JSON.parse(JSON.stringify(state))) || {};
            if (c.fini) {
                resolved = true; fin(); showFeedback('', true);
                if (rappels.surResolu) rappels.surResolu();
                return;
            }
            showFeedback(c.message || "Étape correcte, continue !", true);
            state = JSON.parse(JSON.stringify(state)); annul.vider(); refreshView();
            if (rappels.surEtape) rappels.surEtape();
            return;
        }

        // exercice de simplification : fini quand l'équation a la forme attendue
        if (currentExercise.forme) {
            const fm = currentExercise.forme;
            if (forme(state.left) === forme(fm.left) && forme(state.right) === forme(fm.right)) {
                resolved = true; fin(); showFeedback('', true);
                if (rappels.surResolu) rappels.surResolu();
                return;
            }
            showFeedback(currentExercise.messages && currentExercise.messages.CONTINUE || "Étape correcte, continue !", true);
            state = JSON.parse(JSON.stringify(state)); annul.vider(); refreshView();
            if (rappels.surEtape) rappels.surEtape();
            return;
        }

        const target = currentExercise.targetId;
        const leftFull  = isFullyIsolatedSeq(state.left, target);
        const rightFull = !leftFull && isFullyIsolatedSeq(state.right, target);
        const leftLoose  = !leftFull && isIsolatedSeq(state.left, target);
        const rightLoose = !rightFull && !leftLoose && isIsolatedSeq(state.right, target);

        const onesTotal = countOnesIn(state.left) + countOnesIn(state.right);
        const onesElsewhere = onesTotal - (leftLoose ? 1 : 0) - (rightLoose ? 1 : 0);
        const complete = leftFull && onesElsewhere === 0;

        if (complete) {
            resolved = true;
            fin();
            showFeedback('', true);
            if (rappels.surResolu) rappels.surResolu();
            return;
        }
        let texte;
        if (rightFull) {
            texte = "Étape correcte ! Il ne reste plus qu'à inverser le sens de l'équation avec ⇄.";
        } else if (rightLoose) {
            texte = "Étape correcte ! Inverse le sens de l'équation avec ⇄, puis retire le dénominateur qui vaut 1.";
        } else if (leftLoose && onesElsewhere > 0) {
            texte = "Étape correcte ! Retire les 1 inutiles.";
        } else if (leftLoose) {
            texte = "Étape correcte ! La grandeur à isoler ne doit plus être dans une fraction : efface le 1 du dénominateur (touche-le, puis touche sa croix ✕).";
        } else if (leftFull && onesElsewhere > 0) {
            texte = "Étape correcte ! Retire les 1 inutiles (touche un 1, puis sa croix ✕).";
        } else {
            texte = "Étape correcte, continue !";
        }
        showFeedback(texte, true);
        state = JSON.parse(JSON.stringify(state));
        annul.vider();
        refreshView();
        if (rappels.surEtape) rappels.surEtape();
    }
    // coup de pouce : l'aide de l'étape attendue (une aide par étape validée)
    function coupDePouce() {
        const a = currentExercise && currentExercise.aides;
        if (!a || !a.length || resolved) return;
        showFeedback('<b>Coup de pouce\u00a0:</b> ' + a[Math.min(history.length - 1, a.length - 1)], null);
    }
    // question terminée (résolue ou solution affichée) : l'équation se fige
    function fin() {
        resolved = true;
        if (window.DragDrop) DragDrop.cleanupGhosts();
        const t = part('ed-travail');
        if (t) t.remove();
        const b = part('ed-tete-b');
        if (b) b.remove();
    }

    /* ---------- affichage figé (énoncés, solutions, exemples) ---------- */
    function statique(node) { const html = renderStatic(node); return html; }
    function ligne(g, d) {
        return '<div class="eq-row eq-line-static ep-fige">' + renderStatic(g) + '<span class="eq-sign">=</span>' + renderStatic(d) + '</div>';
    }
    // après insertion dans la page : crochets des racines et hauteur des parenthèses
    function finir(el) { sizeSqrtHooks(el); sizeParens(el); }

    return {
      monter, fin, statique, ligne, finir, coupDePouce,
      evaluer: evaluateNode, compterUns: countOnesIn,
      noeuds: { tile, simple, frac, seq, sumNode, term1, func },
      libelleOutil, noteOutil,
      racine: () => racine,
      // opérations de l'élève (tests automatiques) et état
      ops: {
        etat: () => state, historique: () => history, resolu: () => resolved, erreurs: () => hadError,
        deposer: (path, data) => processDrop(path, data), inserer: handleInsertDropAt,
        terme: processSumTermDrop, den: processFracDenDrop, bloc: processBlocDrop, paren: processParenDrop, neg: negateSide,
        outil: applyFuncTool, effacer: deleteItem, effacerDen: deleteDen, effacerCase: deleteEmptySlot, inverser: flipEquation, verifier: verifyStep,
        annuler: annulerAction,
        // remplacer, simplifier, entrer sous la racine (exercices qui les activent)
        remplacer: (k, path, idx) => { const r = currentExercise.remplacements[k]; processSubst({ type:'subst', id:r.id, nom:r.label, noeud:r.noeud }, { dataset: { path, idx: String(idx) } }); },
        simplifier: (pa, ia, pb, ib) => processSimplif({ from:pa, idx:ia }, pb, ib),
        barres: barresEnAttente,
        entrer: (pa, ia, funcPath) => { const it = getNode(pa).items[ia]; processEntrer({ type:'move', from:pa, idx:ia, id:it.id, label:lab(it), item:Object.assign({}, it) }, funcPath); },
        forme,
        // outils « grandeur = expression » de la réserve, changés en cours de route ([{ id, label, noeud }])
        remplacements: liste => { if (!currentExercise) return; currentExercise.remplacements = liste; if (!resolved) buildPalette(); },
        // remplace l'équation affichée (tests automatiques)
        charger: st => { state = JSON.parse(JSON.stringify(st)); resolved = false; refreshView(); },
        juste: () => equationJuste(state),
      },
    };
  }
  // moteur sans éditeur affiché : écriture figée, nœuds, évaluation
  const BASE = Moteur();
  const N = BASE.noeuds;

  /* ============================================================
     4. ÉCRITURE COMPACTE (ecriture.js de l'application mobile) : texte → nœuds
     ============================================================ */
  const FN = ['sqrt', 'cbrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'p10'];
  function jetons(t) {
    const l = [], re = /\s*([A-Za-z_][A-Za-z0-9_']*|\d+|[[\]|()+\-−=^])/y;
    let m;
    re.lastIndex = 0;
    while (re.lastIndex < t.length) {
      const i = re.lastIndex;
      m = re.exec(t);
      if (!m) { if (/^\s*$/.test(t.slice(i))) break; throw new Error('Écriture illisible : ' + t + ' (position ' + i + ')'); }
      l.push(m[1] === '−' ? '-' : m[1]);
    }
    return l;
  }
  // expr : liste de termes { s, f: [facteurs] } ; facteur : { t:'id' | 'un' | 'fr' | 'par' | 'fn' | 'pow' }
  function analyser(t) {
    const J = jetons(t);
    let i = 0;
    const voir = () => J[i], prendre = x => { if (x && J[i] !== x) throw new Error('« ' + x + ' » attendu dans : ' + t); return J[i++]; };
    function expr() {
      const termes = [];
      let s = 1;
      if (voir() === '+' || voir() === '-') s = prendre() === '-' ? -1 : 1;
      termes.push({ s, f: terme() });
      while (voir() === '+' || voir() === '-') { s = prendre() === '-' ? -1 : 1; termes.push({ s, f: terme() }); }
      return termes;
    }
    function terme() {
      const f = [];
      while (i < J.length && ['+', '-', ')', ']', '|', '='].indexOf(voir()) < 0) f.push(facteur());
      if (!f.length) throw new Error('Terme vide dans : ' + t);
      return f;
    }
    function facteur() {
      let p = primaire();
      while (voir() === '^') { prendre('^'); p = { t: 'pow', b: p, k: +prendre() }; }
      return p;
    }
    function primaire() {
      const x = prendre();
      if (x === '[') { const n = expr(); prendre('|'); const d = expr(); prendre(']'); return { t: 'fr', n, d }; }
      if (x === '(') { const e = expr(); prendre(')'); return { t: 'par', e }; }
      if (x === '1') return { t: 'un' };
      if (/^root\d+$/.test(x) || FN.indexOf(x) >= 0) {
        prendre('('); const e = expr(); prendre(')');
        return /^root/.test(x) ? { t: 'fn', fn: 'proot', n: +x.slice(4), e } : { t: 'fn', fn: x, e };
      }
      if (/^[A-Za-z_]/.test(x)) return { t: 'id', id: x };
      throw new Error('« ' + x + ' » inattendu dans : ' + t);
    }
    const e = expr();
    if (i < J.length) throw new Error('Fin inattendue (« ' + J[i] + ' ») dans : ' + t);
    return e;
  }
  function couper(t) {
    const k = t.indexOf('=');
    if (k < 0 || t.indexOf('=', k + 1) >= 0) throw new Error('Une équation a un seul signe = : ' + t);
    return [t.slice(0, k), t.slice(k + 1)];
  }
  function tuile(f, g) {
    if (f.t === 'un') return { id: 'one', label: '1' };
    if (!(f.id in g)) throw new Error('Grandeur non déclarée : ' + f.id);
    return { id: f.id, label: g[f.id] };
  }
  const estTuile = f => f.t === 'id' || f.t === 'un';
  // grandeur élevée à une puissance entière (v^2, T^4) : une tuile qui porte sa puissance (déplaçable)
  const estPuiss = f => f.t === 'pow' && f.b.t === 'id' && f.k >= 2;
  const tuileP = (f, g) => estPuiss(f) ? Object.assign(tuile(f.b, g), { pow: f.k }) : tuile(f, g);
  const tuileOuP = f => estTuile(f) || estPuiss(f);
  const seulTerme = e => e.length === 1 && e[0].s === 1;
  // zones d'un produit : les grandeurs voisines dans une même zone
  function zones(fs, g) {
    const out = [];
    let tas = [];
    const vider = () => { if (tas.length) { out.push(N.simple(tas)); tas = []; } };
    fs.forEach(f => {
      if (tuileOuP(f)) { tas.push(tuileP(f, g)); return; }
      if (f.t === 'par' && seulTerme(f.e)) { zones(f.e[0].f, g).forEach(z => { vider(); out.push(z); }); return; }
      vider();
      out.push(noeud(f, g));
    });
    vider();
    return out.length ? out : [N.simple([])];
  }
  function somme(e, g) {
    return N.sumNode(e.map(x => ({ sign: x.s, node: N.seq(zones(x.f, g)) })));
  }
  // contenu d'une fraction ou d'une fonction
  function interieur(e, g) {
    if (!seulTerme(e)) return somme(e, g);
    const fs = e[0].f;
    if (fs.every(tuileOuP)) return N.simple(fs.map(f => tuileP(f, g)));
    const z = zones(fs, g);
    return z.length === 1 ? z[0] : N.seq(z);
  }
  function noeud(f, g) {
    if (tuileOuP(f)) return N.simple([tuileP(f, g)]);
    if (f.t === 'fr') return N.frac(interieur(f.n, g), interieur(f.d, g));
    if (f.t === 'par') return seulTerme(f.e) ? interieur(f.e, g) : somme(f.e, g);
    if (f.t === 'fn') return N.func(f.fn === 'p10' ? 'pow10' : f.fn, interieur(f.e, g), f.n);
    if (f.t === 'pow') {
      const b = f.b.t === 'par' ? interieur(f.b.e, g) : noeud(f.b, g);
      return f.k === 2 ? N.func('sq', b) : f.k === 3 ? N.func('cube', b) : N.func('pow', b, f.k);
    }
    throw new Error('Facteur inconnu');
  }
  // un membre : produit de zones, ou somme (plusieurs termes, ou un seul terme négatif)
  function membre(texte, g) {
    const e = analyser(texte);
    if (seulTerme(e)) return N.seq(zones(e[0].f, g));
    return N.seq([somme(e, g)]);
  }
  function lire(texte, g) {
    const [a, b] = couper(texte);
    return { left: membre(a, g), right: membre(b, g) };
  }
  // tuiles d'une équation (avec leur puissance), pour la réserve de l'éditeur
  function tuilesDe(eq) {
    const out = [], vues = {};
    (function voir(n) {
      if (!n) return;
      if (n.kind === 'simple') n.items.forEach(it => { if (it.id !== 'one' && !vues[it.id]) { vues[it.id] = 1; out.push(Object.assign({}, it)); } });
      else if (n.kind === 'func') voir(n.inner);
      else if (n.kind === 'frac') { voir(n.num); voir(n.den); }
      else if (n.kind === 'sum') n.terms.forEach(t => voir(t.node));
      else n.slots.forEach(voir);
    })({ kind: 'seq', slots: [eq.left, eq.right] });
    return out;
  }
  const cloner = o => JSON.parse(JSON.stringify(o));

  // exercice pour EQ.monter à partir de l'écriture compacte
  function exercice(o) {
    const eq = lire(o.eq, o.g);
    const tiles = tuilesDe(eq);
    (o.tuiles || []).forEach(id => { if (!tiles.some(t => t.id === id)) tiles.push({ id, label: o.g[id] }); });
    return {
      tiles, targetId: o.cible, sample: o.valeurs,
      initialLeft: () => cloner(eq.left), initialRight: () => cloner(eq.right),
      funcTools: o.outils || [], needsParenTool: !!o.parentheses,
      aides: o.aides, messages: o.messages,
      // simplification d'une expression : remplacements { id, par: 'écriture compacte' }, racine ouverte,
      // simplification num/den, forme finale attendue (écriture compacte), objectif et consigne affichés
      remplacements: (o.remplacements || []).map(r => ({ id: r.id, label: o.g[r.id], noeud: membre(r.par, o.g) })),
      racineOuverte: !!o.racineOuverte, simplifier: !!o.simplifier, reserveSeule: !!o.reserveSeule,
      simplifierMembres: !!o.simplifierMembres, controle: o.controle,
      forme: o.forme ? lire(o.forme, o.g) : null, objectif: o.objectif, consigne: o.consigne,
    };
  }

  /* ============================================================
     5. DÉMONSTRATION ÉTAPE PAR ÉTAPE (cours, corrections)
     Chaque ligne est alignée sur le signe = ; l'opération faite sur les deux
     membres est écrite à gauche et à droite avec une flèche courbe.
     ============================================================ */
  const FLECHE = '<svg viewBox="0 0 60 46" class="eqd-svg" aria-hidden="true"><path d="M46,4 Q12,10 16,38" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/><path d="M16,38 L7,26 M16,38 L25,29" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const FLECHE_D = FLECHE.replace('class="eqd-svg"', 'class="eqd-svg eqd-svg-d"');
  // membres d'une étape : nœuds donnés, ou écriture compacte
  function membres(e, g) {
    if (e.eq) { const q = lire(e.eq, g || {}); return [q.left, q.right]; }
    return [e.gauche, e.droite];
  }
  function demo(zone, cfg) {
    const etapes = cfg.etapes || [];
    const box = document.createElement('div');
    box.className = 'eqd';
    box.innerHTML = '<div class="eqd-grille"></div><div class="eqd-actions"></div>';
    zone.appendChild(box);
    const grille = box.querySelector('.eqd-grille'), act = box.querySelector('.eqd-actions');
    let i = 0, fini = false;
    function lignes(e, premiere) {
      const [gch, dte] = membres(e, cfg.g);
      let h = '';
      if (!premiere) {
        if (e.op) h += `<div class="eqd-op eqd-new"><span class="eqd-op-g"><b>${e.op}</b>${FLECHE}</span><span></span><span class="eqd-op-d">${FLECHE_D}<b>${e.op}</b></span></div>`;
        if (e.centre) h += `<div class="eqd-centre eqd-new">${e.centre}</div>`;
      }
      h += `<div class="eqd-l eqd-new${e.final ? ' eqd-final' : ''}"><span class="eqd-g">${BASE.statique(gch)}</span><span class="eqd-eq">=</span><span class="eqd-d">${BASE.statique(dte)}</span></div>`;
      if (e.texte) h += `<div class="eqd-texte eqd-new">${e.texte}</div>`;
      return h;
    }
    function montrer(n) {
      grille.querySelectorAll('.eqd-new').forEach(x => x.classList.remove('eqd-new'));
      grille.insertAdjacentHTML('beforeend', lignes(etapes[n], n === 0));
      BASE.finir(grille);
    }
    function toutMontrer() {
      while (i < etapes.length - 1) { i++; montrer(i); }
    }
    // « Afficher tout le cours » (moteur COURS) : toutes les étapes d'un coup, puis la suite
    const inst = { deplier() { if (fini) return; toutMontrer(); boutons(); } };
    function boutons() {
      act.innerHTML = '';
      if (i >= etapes.length - 1) {
        if (fini) return;
        fini = true;
        if (window.COURS && window.COURS.oublier) window.COURS.oublier(inst);
        if (cfg.onFini) cfg.onFini();
        return;
      }
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-secondary';
      b.textContent = i === 0 ? 'Voir la première étape ↓' : 'Étape suivante ↓';
      b.onclick = () => { i++; montrer(i); boutons(); const d = grille.lastElementChild; if (d) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
      const t = document.createElement('button');
      t.type = 'button'; t.className = 'btn-small';
      t.textContent = 'Tout afficher';
      t.onclick = () => { toutMontrer(); boutons(); };
      act.appendChild(b);
      act.appendChild(t);
    }
    montrer(0);
    if (window.COURS && window.COURS.vivant) window.COURS.vivant(inst);
    if (cfg.tout || (window.COURS && window.COURS.tout)) { toutMontrer(); grille.querySelectorAll('.eqd-new').forEach(x => x.classList.remove('eqd-new')); }
    boutons();
    return box;
  }

  /* ============================================================
     6. ÉDITEURS DANS LA PAGE
     ============================================================ */
  function monter(zone, ex, rappels) {
    const m = Moteur();
    const racine = m.monter(zone, ex, rappels);
    return {
      racine, ops: m.ops,
      fin: () => m.fin(),
      // correction : l'éditeur se fige, la démonstration s'affiche dessous
      montrer(sol) {
        m.fin();
        const r = racine.querySelector('.ed-retour');
        if (r) r.innerHTML = '';
        if (sol && sol.etapes && sol.etapes.length) {
          const z = document.createElement('div');
          z.className = 'ed-correction';
          racine.appendChild(z);
          demo(z, { etapes: sol.etapes, g: sol.g, tout: true });
        }
      },
      detruire() { m.fin(); racine.remove(); },
    };
  }
  // partie « perso » du moteur de cours (et des séries) : réussie quand la grandeur est isolée
  function partie(ex, opts) {
    opts = opts || {};
    return {
      type: 'perso', q: opts.q, solution: opts.solution,
      monter(zone, api) {
        const d = document.createElement('div');
        zone.appendChild(d);
        const ed = monter(d, ex, {
          surErreur: () => { if (api.compterErreur) api.compterErreur(); },
          // le message reste à l'écran après chaque vérification (jamais remonter)
          surMessage: f => setTimeout(() => f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30),
          surResolu: () => api.reussi(),
        });
        return { montrer() { ed.montrer({ etapes: opts.etapes, g: opts.g }); } };
      },
    };
  }

  window.EQ = {
    monter, partie, exercice, demo,
    lire, membre, tuilesDe, analyser,
    statique: BASE.statique, ligne: BASE.ligne, finir: BASE.finir,
    evaluer: BASE.evaluer, compterUns: BASE.compterUns, noeuds: N,
    libelleOutil: BASE.libelleOutil, noteOutil: BASE.noteOutil,
    MESSAGES, regles: REGLES,
  };
})();
