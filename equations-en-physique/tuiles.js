/* ============================================================
   Équations en physique : comportement commun des éléments (tuiles)
   des éditeurs d'équation (maquette docs/maquettes/equations-effacer.html,
   propositions 1 + réserve retenues).

   Effacer un élément :
     - un appui sur une tuile la sélectionne et fait apparaître une croix
       noire ✕ ; un appui sur la croix l'efface (un appui ailleurs ou
       Échap annule la sélection) ;
     - une tuile de l'équation déposée dans la réserve (palette) est effacée ;
     - le 1 seul au dénominateur s'efface et la fraction disparaît ;
     - un dénominateur vide qu'on peut supprimer (la page affiche pour lui
       une commande d'effacement) se sélectionne aussi par un appui.
   L'effacement passe toujours par les commandes de chaque page (.tile-del,
   .frac-del, masquées par tuiles.css) : les règles propres à chaque
   module (numérateur vidé, fraction qui disparaît…) restent les siennes.

   Autres améliorations : retour en place animé d'un élément lâché hors de
   toute case, arrivée signalée, grandeurs en italique (nombres droits),
   clavier (Tab, Entrée, Suppr, Échap), historique « ↶ Annuler ».

   API (objet global EPT) :
     EPT.appui              à passer comme `onTap` à enableTileDrag : un appui
                            n'est pas un dépôt (la sélection est gérée ici)
     EPT.historique(f)      historique d'un éditeur ; f() renvoie les boutons
                            « ↶ Annuler » à activer ou désactiver.
                            Renvoie { noter(etat), vider(), annuler() } :
                            noter dans refreshView, vider avant d'afficher une
                            nouvelle équation de départ, annuler renvoie l'état
                            précédent (ou null).
   Chargé après assets/dragdrop.js, avec ../tuiles.css.
   ============================================================ */
(function () {
  'use strict';

  const SEUIL = 8;
  // action en plusieurs temps (historique : une seule entrée)
  let groupe = 0, enGroupe = false;          // déplacement (px) au-delà duquel un appui devient un glisser
  const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── outils ──
  // élément activé par assets/dragdrop.js (il reçoit touch-action: none en style)
  function glissable(cible) {
    for (let n = cible; n && n !== document.body; n = n.parentElement) {
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
  // dénominateur vide qu'on peut supprimer
  function denVide(cible) {
    if (!cible || cible.closest('.eq-tile, .ep-fige')) return null;
    const wrap = cible.closest('.frac-den-wrap');
    const c = caseDen(wrap);
    if (!c || !croixDen(wrap) || c.querySelector('.eq-tile')) return null;
    return c;
  }
  // tuile de l'équation qu'on peut effacer
  function tuileEffacable(cible) {
    const t = cible && cible.closest('.eq-tile');
    if (!t || t.closest('.ep-fige, .drag-ghost') || !t.querySelector('.tile-del')) return null;
    return t;
  }
  // réserve (palette) de l'éditeur d'une tuile
  function reserveDe(el) {
    const ed = el.closest('.ep-edit');
    return ed ? ed.querySelector('.ep-palette') : document.getElementById('palette');
  }

  // ── effacement : par les commandes de la page ──
  function effacerMaintenant(el) {
    const zone = el.closest('.eq-row');
    if (el.classList.contains('slot-simple')) {
      const x = croixDen(el.closest('.frac-den-wrap'));
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
    selection.croix.remove();
    selection = null;
  }
  function selectionner(el) {
    deselectionner();
    const croix = document.createElement('button');
    croix.type = 'button';
    croix.className = 'ept-croix';
    croix.textContent = '✕';
    const den = el.classList.contains('slot-simple');
    croix.setAttribute('aria-label', den ? 'Supprimer le dénominateur' : 'Effacer ' + texte(el));
    croix.title = croix.getAttribute('aria-label');
    // la croix ne commence pas de glisser la tuile qui la porte
    croix.addEventListener('pointerdown', e => e.stopPropagation());
    croix.addEventListener('click', e => { e.stopPropagation(); effacer(el); });
    el.classList.add('ept-sel');
    el.appendChild(croix);
    selection = { el, croix };
  }
  function basculer(el) {
    if (selection && selection.el === el) deselectionner();
    else selectionner(el);
  }

  // ── geste en cours (observé avant les gestionnaires des pages) ──
  let geste = null;
  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest && e.target.closest('.ept-croix')) return;
    const t = tuileEffacable(e.target);
    const d = !t && denVide(e.target);
    // un appui ailleurs que sur l'élément sélectionné annule la sélection
    if (selection && selection.el !== t && selection.el !== d) deselectionner();
    const item = glissable(e.target);
    geste = {
      id: e.pointerId, x: e.clientX, y: e.clientY, bouge: false,
      appui: t || d || null, item,
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
        if (el && (el.classList.contains('slot-simple') ? denVide(el) : tuileEffacable(el))) basculer(el);
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
    const el = tuileEffacable(e.target) || (e.target.classList && e.target.classList.contains('slot-simple') && denVide(e.target));
    if (!el || (el !== e.target)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); effacer(el); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculer(el); }
  });

  // ── grandeurs en italique, éléments accessibles au clavier ──
  // une lettre seule est une grandeur (italique) ; un mot (pH, sin, ln) et
  // Δ restent droits, comme les nombres et les indices
  const LETTRES = /Δ|\p{L}+/gu;
  function italiques(el) {
    if (el.dataset.eptI) return;
    el.dataset.eptI = '1';
    const marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('sub, .tile-del, .ept-croix, .dots, .ept-i') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
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
      if (el.classList.contains('eq-tile') && !el.hasAttribute('tabindex') && tuileEffacable(el)) el.tabIndex = 0;
    });
    racine.querySelectorAll('.frac-den-wrap').forEach(w => {
      const c = caseDen(w);
      if (c && denVide(c) && !c.hasAttribute('tabindex')) {
        c.tabIndex = 0;
        c.setAttribute('aria-label', 'Dénominateur vide');
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

  window.EPT = { appui: () => {}, historique };
})();
