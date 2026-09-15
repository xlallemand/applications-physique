/* ============================================================
   Glisser-déposer commun à toutes les applications, basé sur les
   Pointer Events (souris, tactile, stylet) plutôt que sur l'API
   HTML5 Drag and Drop — celle-ci n'est pas prise en charge au
   toucher sur iOS Safari et se comporte de façon peu fiable sur
   Firefox Android. Les Pointer Events fonctionnent de façon
   cohérente sur ces deux navigateurs ainsi que sur ordinateur.

   Utilisation :

     DragDrop.enable(itemEl, {
       zoneSelector: '.drop-zone',       // sélecteur des zones de dépôt valides
       dragOverClass: 'drag-over',       // classe ajoutée à la zone survolée (optionnel)
       onDrop: (item, zone, evt) => { ... },  // zone est null si déposé hors zone valide
       onCancel: (item) => { ... }        // geste interrompu (pointercancel), sans dépôt
     });

   Pendant le glisser, un "fantôme" (clone de l'élément) suit le
   pointeur ; l'élément d'origine reçoit la classe "dragging".
   ============================================================ */

(function () {
  'use strict';

  // remonte jusqu'au premier ancêtre qui défile horizontalement (ex. la
  // ligne d'équation ".eq-row", trop large pour l'écran sur mobile) : sert
  // au défilement automatique pendant un glisser, pour pouvoir déposer un
  // élément au-delà de la partie visible sans devoir d'abord faire défiler
  // manuellement à la main
  function findHScrollAncestor(el) {
    let node = el;
    while (node && node !== document.body) {
      if (node.scrollWidth > node.clientWidth + 1) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function enable(item, options) {
    const zoneSelector = options.zoneSelector;
    const dragOverClass = options.dragOverClass || 'drag-over';
    const onDrop = options.onDrop;
    const onStart = options.onStart;
    const onCancel = options.onCancel;

    let ghost = null;
    let currentZone = null;
    let pointerId = null;
    let scrollContainer = null;
    let scrollRAF = null;
    let lastX = 0, lastY = 0;

    function findZoneAt(x, y) {
      if (ghost) ghost.style.display = 'none';
      const el = document.elementFromPoint(x, y);
      if (ghost) ghost.style.display = '';
      return el ? el.closest(zoneSelector) : null;
    }

    // pendant le glisser, si le pointeur reste pres du bord gauche/droit du
    // conteneur qui defile, on le fait defiler en continu dans cette
    // direction ; le curseur ne bouge pas mais le contenu qui glisse dessous
    // change, donc la zone survolee doit etre re-evaluee a chaque image
    function autoScrollTick() {
      if (pointerId === null) return;
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        const threshold = 50;
        const maxSpeed = 14;
        let dx = 0;
        if (lastX < rect.left + threshold) {
          dx = -maxSpeed * Math.min(1, (rect.left + threshold - lastX) / threshold);
        } else if (lastX > rect.right - threshold) {
          dx = maxSpeed * Math.min(1, (lastX - (rect.right - threshold)) / threshold);
        }
        if (dx) {
          scrollContainer.scrollLeft += dx;
          setZoneHighlight(findZoneAt(lastX, lastY));
        }
      }
      scrollRAF = requestAnimationFrame(autoScrollTick);
    }

    function createGhost(x, y) {
      if (ghost) { ghost.remove(); ghost = null; }
      const rect = item.getBoundingClientRect();
      ghost = item.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.style.position = 'fixed';
      ghost.style.left = (x - rect.width / 2) + 'px';
      ghost.style.top = (y - rect.height / 2) + 'px';
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      ghost.style.margin = '0';
      document.body.appendChild(ghost);
    }

    function moveGhost(x, y) {
      if (!ghost) return;
      ghost.style.left = (x - ghost.offsetWidth / 2) + 'px';
      ghost.style.top = (y - ghost.offsetHeight / 2) + 'px';
    }

    function setZoneHighlight(zone) {
      if (zone === currentZone) return;
      if (currentZone) currentZone.classList.remove(dragOverClass);
      if (zone) zone.classList.add(dragOverClass);
      currentZone = zone;
    }

    function cleanup() {
      if (ghost) { ghost.remove(); ghost = null; }
      setZoneHighlight(null);
      item.classList.remove('dragging');
      document.body.classList.remove('dnd-active');
      pointerId = null;
      if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
      scrollContainer = null;
    }

    item.style.touchAction = 'none';
    item.style.webkitUserSelect = 'none';
    item.style.userSelect = 'none';

    item.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (pointerId !== null) return; // un glisser est déjà en cours sur cet élément
      pointerId = e.pointerId;
      try { item.setPointerCapture(pointerId); } catch (err) { /* ignore */ }
      item.classList.add('dragging');
      document.body.classList.add('dnd-active');
      createGhost(e.clientX, e.clientY);
      lastX = e.clientX; lastY = e.clientY;
      // l'element glisse peut lui-meme se trouver hors de la zone qui
      // defile (ex. un outil pris dans la palette, a cote de l'equation) :
      // a defaut, on repere le conteneur qui defile via une zone de depot
      // valide, forcement a l'interieur de cette meme zone
      scrollContainer = findHScrollAncestor(item) || findHScrollAncestor(document.querySelector(zoneSelector));
      scrollRAF = requestAnimationFrame(autoScrollTick);
      if (onStart) onStart(item);
      e.preventDefault();
    });

    item.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pointerId || !ghost) return;
      lastX = e.clientX; lastY = e.clientY;
      moveGhost(e.clientX, e.clientY);
      setZoneHighlight(findZoneAt(e.clientX, e.clientY));
    });

    function finish(e) {
      if (e.pointerId !== pointerId) return;
      const zone = ghost ? findZoneAt(e.clientX, e.clientY) : null;
      cleanup();
      onDrop(item, zone, e);
    }

    item.addEventListener('pointerup', finish);
    item.addEventListener('pointercancel', function (e) {
      if (e.pointerId !== pointerId) return;
      cleanup();
      if (onCancel) onCancel(item);
    });
  }

  // Filet de sécurité : supprime tout fantôme resté orphelin dans le DOM
  // (ex. si l'écran a été redessiné pendant qu'un glisser était en cours).
  // À appeler au début du rendu de chaque nouvel écran / nouvelle question.
  function cleanupGhosts() {
    document.querySelectorAll('.drag-ghost').forEach(function (g) { g.remove(); });
  }

  window.DragDrop = { enable: enable, cleanupGhosts: cleanupGhosts };
})();
