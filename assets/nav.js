/* ============================================================
   Navigation commune (bandeau + menu burger) pour les applications
   d'entraînement en Physique-Chimie.

   Utilisation dans une application :

     <div id="app-nav"></div>
     <script src="../assets/nav.js"></script>
     <script>
       const nav = AppNav.init({
         appName: 'Conversions',
         portalHref: '../index.html',
         portalLabel: 'Toutes les applications',
         matiere: 'Outils mathématiques',   // facultatif : sinon déduit de data-matiere de <html>
         onHome: () => showHome(),
         onNavigate: (key) => showModule(key),
         groups: [
           { title: 'Cours', items: [ {key:'1', label:'Module 1 : Cours'}, ... ] },
           ...
         ],
       });

       // Lors d'un changement d'écran :
       nav.setActive('1');                 // met en évidence le module courant (null = accueil)
       nav.setTitle('Module 1 : Cours');    // affiche le module dans le bandeau (null = rien)
       nav.close();                         // ferme le menu (fait automatiquement au clic sur un item)
   ============================================================ */

(function () {
  'use strict';

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // Nom affiché au-dessus du nom de l'application, selon data-matiere de <html>
  const MATIERES = { maths: 'Outils mathématiques', chimie: 'Chimie', physique: 'Physique', college: 'Collège' };

  window.AppNav = {
    init: function (config) {
      const root = document.getElementById(config.rootId || 'app-nav');
      if (!root) throw new Error('AppNav.init : élément racine introuvable (id="app-nav")');

      let menuEl, overlayEl, titleEl;

      function open() { menuEl.classList.add('open'); overlayEl.classList.add('open'); }
      function close() { menuEl.classList.remove('open'); overlayEl.classList.remove('open'); }
      function toggle() { menuEl.classList.contains('open') ? close() : open(); }

      function setActive(key) {
        const targetKey = (key === null || key === undefined) ? '__home__' : String(key);
        menuEl.querySelectorAll('.app-nav-item').forEach(function (b) {
          b.classList.toggle('app-nav-current', b.getAttribute('data-nav-key') === targetKey);
        });
      }

      function setTitle(moduleLabel) {
        if (moduleLabel) {
          titleEl.innerHTML =
            '<span class="app-name">' + config.appName + '</span>' +
            '<span class="sep">&middot;</span>' +
            '<span class="module-name">' + moduleLabel + '</span>';
        } else {
          titleEl.innerHTML = '<span class="app-name">' + config.appName + '</span>';
        }
      }

      // ----- Bandeau supérieur -----
      const topbar = el('div', { class: 'app-topbar' });
      const burger = el('button', { class: 'app-burger', 'aria-label': 'Ouvrir le menu de navigation', type: 'button' },
        '<span></span><span></span><span></span>');
      burger.addEventListener('click', toggle);
      titleEl = el('div', { class: 'app-topbar-title' });
      topbar.appendChild(burger);
      topbar.appendChild(titleEl);

      // ----- Overlay -----
      overlayEl = el('div', { class: 'app-navmenu-overlay' });
      overlayEl.addEventListener('click', close);

      // ----- Menu latéral -----
      menuEl = el('div', { class: 'app-navmenu' });

      // Niveau 1 : bandeau sombre pour quitter l'application (retour au portail)
      const band = el('div', { class: 'app-navmenu-portal' });
      const portalItem = el('button', { type: 'button', class: 'app-nav-portal' },
        '<span class="app-nav-portal-fleche" aria-hidden="true">&larr;</span>' +
        '<span>' + (config.portalLabel || 'Toutes les applications') +
        '<small>Quitter ' + config.appName + '</small></span>');
      portalItem.addEventListener('click', function () {
        close();
        window.location.href = config.portalHref;
      });
      band.appendChild(portalItem);
      const closeBtn = el('button', { type: 'button', class: 'app-nav-close', 'aria-label': 'Fermer le menu' }, '&times;');
      closeBtn.addEventListener('click', close);
      band.appendChild(closeBtn);
      menuEl.appendChild(band);

      // Niveau 2 : l'application (matière + nom), puis ses modules
      const matiere = config.matiere || MATIERES[document.documentElement.getAttribute('data-matiere')] || '';
      menuEl.appendChild(el('div', { class: 'app-navmenu-app' },
        (matiere ? '<div class="app-navmenu-matiere">' + matiere + '</div>' : '') +
        '<div class="app-navmenu-nom">' + config.appName + '</div>'));

      const homeItem = el('button', {
        type: 'button', class: 'app-nav-item', 'data-nav-key': '__home__',
      }, "Accueil de l'application");
      homeItem.addEventListener('click', function () { close(); config.onHome(); });
      menuEl.appendChild(homeItem);

      (config.groups || []).forEach(function (group) {
        if (group.title) {
          menuEl.appendChild(el('div', { class: 'app-navmenu-section-title' }, group.title));
        }
        group.items.forEach(function (item) {
          const btn = el('button', {
            type: 'button', class: 'app-nav-item', 'data-nav-key': String(item.key),
          }, item.label);
          btn.addEventListener('click', function () { close(); config.onNavigate(item.key); });
          menuEl.appendChild(btn);
        });
      });

      root.appendChild(topbar);
      root.appendChild(el('div', { class: 'app-topbar-spacer' }));
      root.appendChild(overlayEl);
      root.appendChild(menuEl);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });

      setTitle(null);

      return { open: open, close: close, toggle: toggle, setActive: setActive, setTitle: setTitle };
    },
  };
})();
