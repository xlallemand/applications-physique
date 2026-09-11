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
       onDrop: (item, zone, evt) => { ... }  // zone est null si déposé hors zone valide
     });

   Pendant le glisser, un "fantôme" (clone de l'élément) suit le
   pointeur ; l'élément d'origine reçoit la classe "dragging".
   ============================================================ */

(function () {
  'use strict';

  function enable(item, options) {
    const zoneSelector = options.zoneSelector;
    const dragOverClass = options.dragOverClass || 'drag-over';
    const onDrop = options.onDrop;
    const onStart = options.onStart;

    let ghost = null;
    let currentZone = null;
    let pointerId = null;

    function findZoneAt(x, y) {
      if (ghost) ghost.style.display = 'none';
      const el = document.elementFromPoint(x, y);
      if (ghost) ghost.style.display = '';
      return el ? el.closest(zoneSelector) : null;
    }

    function createGhost(x, y) {
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
    }

    item.style.touchAction = 'none';
    item.style.webkitUserSelect = 'none';
    item.style.userSelect = 'none';

    item.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerId = e.pointerId;
      try { item.setPointerCapture(pointerId); } catch (err) { /* ignore */ }
      item.classList.add('dragging');
      document.body.classList.add('dnd-active');
      createGhost(e.clientX, e.clientY);
      if (onStart) onStart(item);
      e.preventDefault();
    });

    item.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pointerId || !ghost) return;
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
    item.addEventListener('pointercancel', function () { cleanup(); });
  }

  window.DragDrop = { enable: enable };
})();
